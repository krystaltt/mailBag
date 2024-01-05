//get the email
const ImapClient = require("emailjs-imap-client");
import { ParsedMail } from "mailparser";
import { simpleParser } from "mailparser";
import { IServerInfo } from "./ServerInfo";

export interface ICallOptions {
  mailbox: string;
  id?: number;
}

export interface IMessage {
  id: string;
  date: string;
  from: string;
  subject: string;
  body?: string;
}

export interface IMailbox {
  name: string;
  path: string;
}

process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

export class Worker {
  private static serverInfo: IServerInfo;
  constructor(inServerInfo: IServerInfo) {
    Worker.serverInfo = inServerInfo;
  }

  //all the other method will make use of this when connecting to the IMAP
  private async connectToServer(): Promise<any> {
    const client: any = new ImapClient.default(
      Worker.serverInfo.imap.host,
      Worker.serverInfo.imap.port,
      { auth: Worker.serverInfo.imap.auth }
    );
    client.loglevel = client.LOG_LEVEL_NONE;
    client.onerror = (inError: Error) => {
      console.log("IMAP.WORKER.listMailBox(): Connect error", inError);
    };
    await client.connect();
    return client;
  }

  //four method for mailbox
  //1.listing mailboxs
  public async listMailboxes(): Promise<IMailbox[]> {
    try {
      const client: any = await this.connectToServer();
      console.log("Connected to server");
      const mailboxes: any = await client.listMailboxes();
      console.log("Mailboxes fetched successfully:", mailboxes);
      await client.close();
      console.log("Connection closed");
      const finalMailboxes: IMailbox[] = [];
      const iterateChildren: Function = (inArray: any[]): void => {
        inArray.forEach((inValue: any) => {
          finalMailboxes.push({
            name: inValue.name,
            path: inValue.path,
          });
          if (inValue.children && inValue.children.length > 0) {
            iterateChildren(inValue.children);
          }
        });
      };
      iterateChildren(mailboxes.children);
      return finalMailboxes;
    } catch (error) {
      console.error("Error fetching mailboxes:", error);
      throw error;
    }
  }

  //2.listing messages
  public async listMessages(inCallOptions: ICallOptions): Promise<IMessage[]> {
    console.log("S/IMAP.Worker.listMessages()", inCallOptions);

    const client: any = await this.connectToServer();

    // select the mailbox first.  This gives us the message count.
    const mailbox: any = await client.selectMailbox(inCallOptions.mailbox);
    console.log(
      `IMAP.Worker.listMessages(): Message count = ${mailbox.exists}`
    );
    // If there are no messages then just return an empty array.
    if (mailbox.exists === 0) {
      await client.close();
      return [];
    }
    const messages: any[] = await client.listMessages(
      inCallOptions.mailbox,
      "1:*",
      ["uid", "envelope"]
    );

    await client.close();

    // Translate from emailjs-imap-client message objects to app-specific objects.
    const finalMessages: IMessage[] = [];
    messages.forEach((inValue: any) => {
      finalMessages.push({
        id: inValue.uid,
        date: inValue.envelope.date,
        from: inValue.envelope.from[0].address,
        subject: inValue.envelope.subject,
      });
    });

    return finalMessages;
  }

  //3.message body
  public async getMessageBody(
    inCallOptions: ICallOptions
  ): Promise<string | undefined> {
    console.log("S/IMAP.Worker.getMessageBody()", inCallOptions);

    const client: any = await this.connectToServer();

    // noinspection TypeScriptValidateJSTypes
    const messages: any[] = await client.listMessages(
      inCallOptions.mailbox,
      inCallOptions.id,
      ["body[]"],
      { byUid: true }
    );
    const parsed: ParsedMail = await simpleParser(messages[0]["body[]"]);

    await client.close();

    return parsed.text;
  }

  //4. delete message
  public async deleteMessage(inCallOptions: ICallOptions): Promise<any> {
    const client: any = await this.connectToServer();
    await client.deleteMessage(inCallOptions.mailbox, inCallOptions.id, {
      byUid: true,
    });
    await client.close();
  }
}
