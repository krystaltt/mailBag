// Library imports.
import axios from "axios";

// App imports.
import { config } from "./config";

export class Worker {
  public async sendMessage(
    inTo: string,
    inFrom: string,
    inSubject: string,
    inMessage: string
  ): Promise<void> {
    console.log("C/SMTP.Worker.sendMessage()");

    await axios.post(`${config.serverAddress}/messages`, {
      to: inTo,
      from: inFrom,
      subject: inSubject,
      text: inMessage,
    });
  }
}
