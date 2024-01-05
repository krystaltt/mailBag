"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = __importDefault(require("path"));
const express_1 = __importDefault(require("express"));
const ServerInfo_1 = require("./ServerInfo");
const IMAP = __importStar(require("./IMAP"));
const SMTP = __importStar(require("./SMTP"));
const Contacts = __importStar(require("./contact"));
const app = (0, express_1.default)();
app.use(express_1.default.json());
app.use("/", express_1.default.static(path_1.default.join(__dirname, "../../client/dist")));
//header for REST function
app.use(function (inRequest, inResponse, inNext) {
    inResponse.header("Access-Control-Allow-Origin", "*");
    //This involves configuring backend server to respond with the appropriate headers, specifically Access-Control-Allow-Methods, to permit GET, POST, DELETE, OPTIONS,PUT requests from your frontend origin
    inResponse.header("Access-Control-Allow-Methods", "GET, POST, DELETE, OPTIONS, PUT");
    inResponse.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    inNext();
});
//REST Endpoint: List Mailboxes
app.get("/mailboxes", (inRequest, inResponse) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const imapWorker = new IMAP.Worker(ServerInfo_1.serverInfo);
        const mailboxes = yield imapWorker.listMailboxes();
        inResponse.json(mailboxes);
    }
    catch (inError) {
        inResponse.send("error");
    }
}));
//REST Endpoint: List Message
app.get("/mailboxes/:mailbox", (inRequest, inResponse) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const imapWorker = new IMAP.Worker(ServerInfo_1.serverInfo);
        const message = yield imapWorker.listMessages({
            mailbox: inRequest.params.mailbox,
        });
        inResponse.json(message);
    }
    catch (inError) {
        console.error("Error fetching messages:", inError);
        inResponse.status(500).send("Error fetching messages");
    }
}));
//for [Gmail]/mailbox
app.get("/mailboxes/:mailbox/:subDir", (inRequest, inResponse) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const mailboxsString = inRequest.params.mailbox
            .concat("/")
            .concat(inRequest.params.subDir);
        const imapWorker = new IMAP.Worker(ServerInfo_1.serverInfo);
        const message = yield imapWorker.listMessages({
            mailbox: mailboxsString,
        });
        inResponse.json(message);
    }
    catch (inError) {
        console.error("Error fetching messages:", inError);
        inResponse.status(500).send("Error fetching messages");
    }
}));
//REST Endpoint: Get a message
app.get("/messages/:mailbox/:id", (inRequest, inResponse) => __awaiter(void 0, void 0, void 0, function* () {
    console.log("GET /messages (3)", inRequest.params.mailbox, inRequest.params.id);
    try {
        const imapWorker = new IMAP.Worker(ServerInfo_1.serverInfo);
        const messageBody = yield imapWorker.getMessageBody({
            mailbox: inRequest.params.mailbox,
            id: parseInt(inRequest.params.id, 10),
        });
        console.log("GET /messages (3): Ok", messageBody);
        inResponse.send(messageBody);
    }
    catch (inError) {
        console.log("GET /messages (3): Error", inError);
        inResponse.send("error");
    }
}));
//for [Gmail]/:mailbox/:id
app.get("/messages/:mailbox/:subDir/:id", (inRequest, inResponse) => __awaiter(void 0, void 0, void 0, function* () {
    console.log("GET /messages (3)", inRequest.params.mailbox, inRequest.params.id);
    try {
        const mailboxsString = inRequest.params.mailbox
            .concat("/")
            .concat(inRequest.params.subDir);
        const imapWorker = new IMAP.Worker(ServerInfo_1.serverInfo);
        const messageBody = yield imapWorker.getMessageBody({
            mailbox: mailboxsString,
            id: parseInt(inRequest.params.id, 10),
        });
        console.log("GET /messages (3): Ok", messageBody);
        inResponse.send(messageBody);
    }
    catch (inError) {
        console.log("GET /messages (3): Error", inError);
        inResponse.send("error");
    }
}));
//REST Endpoint: Delete a message
app.delete("/messages/:mailbox/:id", (inRequest, inResponse) => __awaiter(void 0, void 0, void 0, function* () {
    console.log("DELETE /messages");
    try {
        const imapWorker = new IMAP.Worker(ServerInfo_1.serverInfo);
        yield imapWorker.deleteMessage({
            mailbox: inRequest.params.mailbox,
            id: parseInt(inRequest.params.id, 10),
        });
        console.log("DELETE /messages: Ok");
        inResponse.send("ok");
    }
    catch (inError) {
        console.log("DELETE /messages: Error", inError);
        inResponse.send("error");
    }
}));
////for [Gmail]/:mailbox/:id
app.delete("/messages/:mailbox/:sub/:id", (inRequest, inResponse) => __awaiter(void 0, void 0, void 0, function* () {
    console.log("DELETE /messages");
    try {
        const mailboxsString = inRequest.params.mailbox
            .concat("/")
            .concat(inRequest.params.subDir);
        const imapWorker = new IMAP.Worker(ServerInfo_1.serverInfo);
        yield imapWorker.deleteMessage({
            mailbox: mailboxsString,
            id: parseInt(inRequest.params.id, 10),
        });
        console.log("DELETE /messages: Ok");
        inResponse.send("ok");
    }
    catch (inError) {
        console.log("DELETE /messages: Error", inError);
        inResponse.send("error");
    }
}));
//REST Endpoint: Send a message
app.post("/messages", (inRequest, inResponse) => __awaiter(void 0, void 0, void 0, function* () {
    console.log("POST /messages", inRequest.body);
    try {
        const smtpWorker = new SMTP.Worker(ServerInfo_1.serverInfo);
        yield smtpWorker.sendMessage(inRequest.body);
        console.log("POST /messages: Ok");
        inResponse.send("ok");
    }
    catch (inError) {
        console.log("POST /messages: Error", inError);
        inResponse.send("error");
    }
}));
//REST Endpoint: List contacts
app.get("/contacts", (inRequest, inResponse) => __awaiter(void 0, void 0, void 0, function* () {
    console.log("GET /contacts");
    try {
        const contactsWorker = new Contacts.Worker();
        const contacts = yield contactsWorker.listContacts();
        console.log("GET /contacts: Ok", contacts);
        inResponse.json(contacts);
    }
    catch (inError) {
        console.log("GET /contacts: Error", inError);
        inResponse.send("error");
    }
}));
//REST Endpoint: Add contact
app.post("/contacts", (inRequest, inResponse) => __awaiter(void 0, void 0, void 0, function* () {
    console.log("POST /contacts", inRequest.body);
    try {
        const contactsWorker = new Contacts.Worker();
        const contact = yield contactsWorker.addContact(inRequest.body);
        console.log("POST /contacts: Ok", contact);
        inResponse.json(contact);
    }
    catch (inError) {
        console.log("POST /contacts: Error", inError);
        inResponse.send("error");
    }
}));
//REST Endpoint: Delete contact
app.delete("/contacts/:id", (inRequest, inResponse) => __awaiter(void 0, void 0, void 0, function* () {
    console.log("DELETE /contacts", inRequest.body);
    try {
        const contactsWorker = new Contacts.Worker();
        yield contactsWorker.deleteContact(inRequest.params.id);
        console.log("Contact deleted");
        inResponse.send("ok");
    }
    catch (inError) {
        console.log(inError);
        inResponse.send("error");
    }
}));
//REST Endpoint: Update contact
app.put("/contacts", (inRequest, inResponse) => __awaiter(void 0, void 0, void 0, function* () {
    console.log("PUT/contacts", inRequest.body);
    try {
        const contactWorker = new Contacts.Worker();
        const contact = yield contactWorker.updateContact(inRequest.body);
        console.log("Updated Contact:", contact);
        inResponse.json(contact);
    }
    catch (inError) {
        console.error("Error in PUT /contacts:", inError);
        inResponse.status(500).send("Internal Server Error");
    }
}));
const PORT = 80; // Port number
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
//# sourceMappingURL=main.js.map