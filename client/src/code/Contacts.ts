// Library imports.
//axios helps facilitate this interaction by enabling the front-end to send HTTP requests to specific endpoints on the back-end server and receive responses.
import axios, { Axios, AxiosResponse } from "axios";

// App imports.
import { config } from "./config";

// Define interface to describe a contact.  Note that we'll only have an _id field when retrieving or adding, so it has to be optional.
export interface IContact {
  _id?: number;
  name: string;
  email: string;
}

export class Worker {
  //   updateContact(contactID: any, updatedContact: { name: any; email: any }) {
  //     throw new Error("Method not implemented.");
  //   }
  public async listContacts(): Promise<IContact[]> {
    console.log("C/Contacts.Worker.listContacts())");
    const response: AxiosResponse = await axios.get(
      `${config.serverAddress}/contacts`
    );
    return response.data;
  }

  public async addContact(inContact: IContact): Promise<IContact> {
    console.log("C/Contacts.Worker.addContact()");
    const response: AxiosResponse = await axios.post(
      `${config.serverAddress}/contacts`,
      inContact
    );
    return response.data;
  }

  public async deleteContact(inID): Promise<void> {
    console.log("C/Contacts.Worker.deleteContact()");
    await axios.delete(`${config.serverAddress}/contacts/${inID}`);
  }

  public async updateContact(inContact: IContact): Promise<IContact> {
    console.log("Incoming Contact Data:", inContact);
    console.log("C/Contacts.Worker.updateContact()");
    const response: AxiosResponse = await axios.put(
      `${config.serverAddress}/contacts`,
      inContact
    );
    console.log("Server Response:", response.data);
    return response.data;
  }
}
