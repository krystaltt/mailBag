// Library imports.
import axios, { AxiosResponse } from "axios";

// App imports.
import { config } from "./config";

// Define interface to describe a mailbox.
export interface IMailbox {
  name: string;
  path: string;
}

// Define interface to describe a received message.  Note that body is optional since it isn't sent when listing
// messages.
export interface IMessage {
  id: string;
  date: string;
  from: string;
  subject: string;
  body?: string;
}

export class Worker {
  public async listMailboxes(): Promise<IMailbox[]> {
    console.log("C/IMAP.Worker.listMailboxes()");

    const response: AxiosResponse = await axios.get(
      `${config.serverAddress}/mailboxes`
    );
    return response.data;
  }

  public async listMessages(inMailbox: string): Promise<IMessage[]> {
    console.log("C/IMAP.Worker.listMessages()");

    const response: AxiosResponse = await axios.get(
      `${config.serverAddress}/mailboxes/${inMailbox}`
    );
    return response.data;
  }

  public async getMessageBody(
    inID: string,
    inMailbox: String
  ): Promise<string> {
    console.log("C/IMAP.Worker.getMessageBody()", inID);

    const response: AxiosResponse = await axios.get(
      `${config.serverAddress}/messages/${inMailbox}/${inID}`
    );
    return response.data;
  }

  public async deleteMessage(inID: string, inMailbox: String): Promise<void> {
    console.log("C/IMAP.Worker.getMessageBody()", inID);

    await axios.delete(`${config.serverAddress}/messages/${inMailbox}/${inID}`);
  }
}
