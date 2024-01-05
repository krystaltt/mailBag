import path from "path";
import express, { Express, NextFunction, Request, Response } from "express";
import { serverInfo } from "./ServerInfo";
import * as IMAP from "./IMAP";
import * as SMTP from "./SMTP";
import * as Contacts from "./contact";
import { IContact } from "./contact";

const app: Express = express();

app.use(express.json());
app.use("/", express.static(path.join(__dirname, "../../client/dist")));

//header for REST function
app.use(function (
  inRequest: Request,
  inResponse: Response,
  inNext: NextFunction
) {
  inResponse.header("Access-Control-Allow-Origin", "*");
  //This involves configuring backend server to respond with the appropriate headers, specifically Access-Control-Allow-Methods, to permit GET, POST, DELETE, OPTIONS,PUT requests from your frontend origin
  inResponse.header(
    "Access-Control-Allow-Methods",
    "GET, POST, DELETE, OPTIONS, PUT"
  );
  inResponse.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept"
  );
  inNext();
});

//REST Endpoint: List Mailboxes
app.get("/mailboxes", async (inRequest: Request, inResponse: Response) => {
  try {
    const imapWorker: IMAP.Worker = new IMAP.Worker(serverInfo);
    const mailboxes: IMAP.IMailbox[] = await imapWorker.listMailboxes();
    inResponse.json(mailboxes);
  } catch (inError) {
    inResponse.send("error");
  }
});

//REST Endpoint: List Message
app.get(
  "/mailboxes/:mailbox",
  async (inRequest: Request, inResponse: Response) => {
    try {
      const imapWorker: IMAP.Worker = new IMAP.Worker(serverInfo);
      const message: IMAP.IMessage[] = await imapWorker.listMessages({
        mailbox: inRequest.params.mailbox,
      });
      inResponse.json(message);
    } catch (inError) {
      console.error("Error fetching messages:", inError);
      inResponse.status(500).send("Error fetching messages");
    }
  }
);
//for [Gmail]/mailbox
app.get(
  "/mailboxes/:mailbox/:subDir",
  async (inRequest: Request, inResponse: Response) => {
    try {
      const mailboxsString = inRequest.params.mailbox
        .concat("/")
        .concat(inRequest.params.subDir);
      const imapWorker: IMAP.Worker = new IMAP.Worker(serverInfo);
      const message: IMAP.IMessage[] = await imapWorker.listMessages({
        mailbox: mailboxsString,
      });
      inResponse.json(message);
    } catch (inError) {
      console.error("Error fetching messages:", inError);
      inResponse.status(500).send("Error fetching messages");
    }
  }
);

//REST Endpoint: Get a message
app.get(
  "/messages/:mailbox/:id",
  async (inRequest: Request, inResponse: Response) => {
    console.log(
      "GET /messages (3)",
      inRequest.params.mailbox,
      inRequest.params.id
    );
    try {
      const imapWorker: IMAP.Worker = new IMAP.Worker(serverInfo);
      const messageBody: string | undefined = await imapWorker.getMessageBody({
        mailbox: inRequest.params.mailbox,
        id: parseInt(inRequest.params.id, 10),
      });
      console.log("GET /messages (3): Ok", messageBody);
      inResponse.send(messageBody);
    } catch (inError) {
      console.log("GET /messages (3): Error", inError);
      inResponse.send("error");
    }
  }
);
//for [Gmail]/:mailbox/:id
app.get(
  "/messages/:mailbox/:subDir/:id",
  async (inRequest: Request, inResponse: Response) => {
    console.log(
      "GET /messages (3)",
      inRequest.params.mailbox,
      inRequest.params.id
    );
    try {
      const mailboxsString = inRequest.params.mailbox
        .concat("/")
        .concat(inRequest.params.subDir);
      const imapWorker: IMAP.Worker = new IMAP.Worker(serverInfo);
      const messageBody: string | undefined = await imapWorker.getMessageBody({
        mailbox: mailboxsString,
        id: parseInt(inRequest.params.id, 10),
      });
      console.log("GET /messages (3): Ok", messageBody);
      inResponse.send(messageBody);
    } catch (inError) {
      console.log("GET /messages (3): Error", inError);
      inResponse.send("error");
    }
  }
);

//REST Endpoint: Delete a message
app.delete(
  "/messages/:mailbox/:id",
  async (inRequest: Request, inResponse: Response) => {
    console.log("DELETE /messages");
    try {
      const imapWorker: IMAP.Worker = new IMAP.Worker(serverInfo);
      await imapWorker.deleteMessage({
        mailbox: inRequest.params.mailbox,
        id: parseInt(inRequest.params.id, 10),
      });
      console.log("DELETE /messages: Ok");
      inResponse.send("ok");
    } catch (inError) {
      console.log("DELETE /messages: Error", inError);
      inResponse.send("error");
    }
  }
);

////for [Gmail]/:mailbox/:id
app.delete(
  "/messages/:mailbox/:sub/:id",
  async (inRequest: Request, inResponse: Response) => {
    console.log("DELETE /messages");
    try {
      const mailboxsString = inRequest.params.mailbox
        .concat("/")
        .concat(inRequest.params.subDir);
      const imapWorker: IMAP.Worker = new IMAP.Worker(serverInfo);
      await imapWorker.deleteMessage({
        mailbox: mailboxsString,
        id: parseInt(inRequest.params.id, 10),
      });
      console.log("DELETE /messages: Ok");
      inResponse.send("ok");
    } catch (inError) {
      console.log("DELETE /messages: Error", inError);
      inResponse.send("error");
    }
  }
);

//REST Endpoint: Send a message
app.post("/messages", async (inRequest: Request, inResponse: Response) => {
  console.log("POST /messages", inRequest.body);
  try {
    const smtpWorker: SMTP.Worker = new SMTP.Worker(serverInfo);
    await smtpWorker.sendMessage(inRequest.body);
    console.log("POST /messages: Ok");
    inResponse.send("ok");
  } catch (inError) {
    console.log("POST /messages: Error", inError);
    inResponse.send("error");
  }
});

//REST Endpoint: List contacts
app.get("/contacts", async (inRequest: Request, inResponse: Response) => {
  console.log("GET /contacts");
  try {
    const contactsWorker: Contacts.Worker = new Contacts.Worker();
    const contacts: IContact[] = await contactsWorker.listContacts();
    console.log("GET /contacts: Ok", contacts);
    inResponse.json(contacts);
  } catch (inError) {
    console.log("GET /contacts: Error", inError);
    inResponse.send("error");
  }
});

//REST Endpoint: Add contact
app.post("/contacts", async (inRequest: Request, inResponse: Response) => {
  console.log("POST /contacts", inRequest.body);
  try {
    const contactsWorker: Contacts.Worker = new Contacts.Worker();
    const contact: IContact = await contactsWorker.addContact(inRequest.body);
    console.log("POST /contacts: Ok", contact);
    inResponse.json(contact);
  } catch (inError) {
    console.log("POST /contacts: Error", inError);
    inResponse.send("error");
  }
});

//REST Endpoint: Delete contact
app.delete(
  "/contacts/:id",
  async (inRequest: Request, inResponse: Response) => {
    console.log("DELETE /contacts", inRequest.body);
    try {
      const contactsWorker: Contacts.Worker = new Contacts.Worker();
      await contactsWorker.deleteContact(inRequest.params.id);
      console.log("Contact deleted");
      inResponse.send("ok");
    } catch (inError) {
      console.log(inError);
      inResponse.send("error");
    }
  }
);

//REST Endpoint: Update contact
app.put("/contacts", async (inRequest: Request, inResponse: Response) => {
  console.log("PUT/contacts", inRequest.body);
  try {
    const contactWorker: Contacts.Worker = new Contacts.Worker();
    const contact: IContact = await contactWorker.updateContact(inRequest.body);
    console.log("Updated Contact:", contact);
    inResponse.json(contact);
  } catch (inError) {
    console.error("Error in PUT /contacts:", inError);
    inResponse.status(500).send("Internal Server Error");
  }
});

const PORT = 80; // Port number

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
