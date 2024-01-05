import Nedb from "nedb";
import * as path from "path";
const Datastore = require("nedb");

export interface IContact {
  _id?: number;
  name: string;
  email: string;
}

export class Worker {
  private db: Nedb;
  constructor() {
    this.db = new Datastore({
      filename: path.join(__dirname, "constacts.db"),
      autoload: true,
    });
  }

  //list contacts
  public listContacts(): Promise<IContact[]> {
    return new Promise((inResolve, inReject) => {
      this.db.find({}, (inError: Error, inDocs: IContact[]) => {
        if (inError) {
          inReject(inError);
        } else {
          inResolve(inDocs);
        }
      });
    });
  }

  //add contact
  public addContact(inContact: IContact): Promise<IContact> {
    return new Promise((inResolve, inReject) => {
      this.db.insert(inContact, (inError: Error | null, inNewDoc: IContact) => {
        if (inError) {
          inReject(inError);
        } else {
          inResolve(inNewDoc);
        }
      });
    });
  }

  //delete contact
  public deleteContact(inID: string): Promise<string> {
    return new Promise((inResolve, inReject) => {
      this.db.remove(
        { _id: inID },
        {},
        (inError: Error | null, inNumRemoved: number) => {
          if (inError) {
            inReject(inError);
          } else {
            inResolve("");
          }
        }
      );
    });
  }

  public updateContact(inContact: IContact): Promise<IContact> {
    return new Promise<IContact>((inResolve, inReject) => {
      this.db.update(
        { _id: inContact._id },
        { $set: inContact },
        { returnUpdatedDocs: true },
        (
          inError: Error | null,
          numberOfUpdated: number,
          inDoc: IContact,
          upsert: boolean
        ) => {
          if (inError) {
            inReject(inError);
          } else {
            // Regardless of the number of replacements or if the document existed,
            // resolve with the updated contact
            inResolve(inDoc);
          }
        }
      );
    });
  }
}
