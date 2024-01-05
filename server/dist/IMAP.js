"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Worker = void 0;
//get the email
const ImapClient = require("emailjs-imap-client");
const mailparser_1 = require("mailparser");
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
class Worker {
    constructor(inServerInfo) {
        Worker.serverInfo = inServerInfo;
    }
    //all the other method will make use of this when connecting to the IMAP
    connectToServer() {
        return __awaiter(this, void 0, void 0, function* () {
            const client = new ImapClient.default(Worker.serverInfo.imap.host, Worker.serverInfo.imap.port, { auth: Worker.serverInfo.imap.auth });
            client.loglevel = client.LOG_LEVEL_NONE;
            client.onerror = (inError) => {
                console.log("IMAP.WORKER.listMailBox(): Connect error", inError);
            };
            yield client.connect();
            return client;
        });
    }
    //four method for mailbox
    //1.listing mailboxs
    listMailboxes() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const client = yield this.connectToServer();
                console.log("Connected to server");
                const mailboxes = yield client.listMailboxes();
                console.log("Mailboxes fetched successfully:", mailboxes);
                yield client.close();
                console.log("Connection closed");
                const finalMailboxes = [];
                const iterateChildren = (inArray) => {
                    inArray.forEach((inValue) => {
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
            }
            catch (error) {
                console.error("Error fetching mailboxes:", error);
                throw error;
            }
        });
    }
    //2.listing messages
    listMessages(inCallOptions) {
        return __awaiter(this, void 0, void 0, function* () {
            console.log("S/IMAP.Worker.listMessages()", inCallOptions);
            const client = yield this.connectToServer();
            // select the mailbox first.  This gives us the message count.
            const mailbox = yield client.selectMailbox(inCallOptions.mailbox);
            console.log(`IMAP.Worker.listMessages(): Message count = ${mailbox.exists}`);
            // If there are no messages then just return an empty array.
            if (mailbox.exists === 0) {
                yield client.close();
                return [];
            }
            const messages = yield client.listMessages(inCallOptions.mailbox, "1:*", ["uid", "envelope"]);
            yield client.close();
            // Translate from emailjs-imap-client message objects to app-specific objects.
            const finalMessages = [];
            messages.forEach((inValue) => {
                finalMessages.push({
                    id: inValue.uid,
                    date: inValue.envelope.date,
                    from: inValue.envelope.from[0].address,
                    subject: inValue.envelope.subject,
                });
            });
            return finalMessages;
        });
    }
    //3.message body
    getMessageBody(inCallOptions) {
        return __awaiter(this, void 0, void 0, function* () {
            console.log("S/IMAP.Worker.getMessageBody()", inCallOptions);
            const client = yield this.connectToServer();
            // noinspection TypeScriptValidateJSTypes
            const messages = yield client.listMessages(inCallOptions.mailbox, inCallOptions.id, ["body[]"], { byUid: true });
            const parsed = yield (0, mailparser_1.simpleParser)(messages[0]["body[]"]);
            yield client.close();
            return parsed.text;
        });
    }
    //4. delete message
    deleteMessage(inCallOptions) {
        return __awaiter(this, void 0, void 0, function* () {
            const client = yield this.connectToServer();
            yield client.deleteMessage(inCallOptions.mailbox, inCallOptions.id, {
                byUid: true,
            });
            yield client.close();
        });
    }
}
exports.Worker = Worker;
//# sourceMappingURL=IMAP.js.map