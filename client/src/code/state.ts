// React imports.
import React from "react";

// App imports.
import * as Contacts from "./Contacts";
import { config } from "./config";
import * as IMAP from "./IMAP";
import * as SMTP from "./SMTP";

let stateSingleton: any = null;
export function createState(inParentComponent: React.Component): any {
  //ensure there is only ever one instance of state
  if (stateSingleton === null) {
    stateSingleton = {
      pleaseWaitVisible: false,
      contacts: [],
      mailboxes: [],
      messages: [],
      currentView: "welcome",
      currentMailbox: null,
      messageID: null,
      messageDate: null,
      messageFrom: null,
      messageTo: null,
      messageSubject: null,
      messageBody: null,
      contactID: null,
      contactName: null,
      contactEmail: null,

      showHidePleaseWait: function (inVisible: boolean): void {
        this.setState(() => {
          pleaseWaitVisible: inVisible;
        });
      }.bind(inParentComponent),

      //
      addMailboxToList: function (inMailbox: IMAP.IMailbox): void {
        console.log("C/state.addMailboxToList()", inMailbox);

        this.setState((prevState) => ({
          mailboxes: [...prevState.mailboxes, inMailbox],
        }));
      }.bind(inParentComponent),

      //
      addContactToList: function (inContact: Contacts.IContact): void {
        console.log("C/state.addContactToList()", inContact);

        this.setState((prevState) => ({
          contacts: [...prevState.contacts, inContact],
        }));
      }.bind(inParentComponent),

      //--methiod for toolbar.tsx
      showComposeMessage: function (inType: string): void {
        console.log("C/state.showComposeMessage()");

        switch (inType) {
          case "new":
            this.setState(() => ({
              currentView: "compose",
              messageTo: "",
              messageSubject: "",
              messageBody: "",
              messageFrom: config.userEmail,
            }));
            break;

          case "reply":
            this.setState(() => ({
              currentView: "compose",
              messageTo: this.state.messageFrom,
              messageSubject: `Re: ${this.state.messageSubject}`,
            }));
            break;

          case "contact":
            this.setState(() => ({
              currentView: "compose",
              messageTo: this.state.contactEmail,
              messageSubject: "",
              messageBody: "",
              messageFrom: config.userEmail,
            }));
            break;
        }
      }.bind(inParentComponent),

      //
      showAddContact: function (): void {
        console.log("C/state.showAddContact()");

        this.setState(() => ({
          currentView: "contactAdd",
          contactID: null,
          contactName: "",
          contactEmail: "",
        }));
      }.bind(inParentComponent),

      //--methods for Mialboxlist.tsx
      setCurrentMailbox: function (inPath: String): void {
        console.log("C/state.setCurrentMailbox()", inPath);

        // Update state.
        this.setState(() => ({
          currentView: "welcome",
          currentMailbox: inPath,
        }));

        // get the list of messages for the mailbox.
        this.state.getMessages(inPath);
      }.bind(inParentComponent),

      //
      getMessages: async function (inPath: string): Promise<void> {
        console.log("C/state.getMessages()");

        this.state.showHidePleaseWait(true);
        const imapWorker: IMAP.Worker = new IMAP.Worker();
        const messages: IMAP.IMessage[] = await imapWorker.listMessages(inPath);
        this.state.showHidePleaseWait(false);

        this.state.clearMessages();
        messages.forEach((inMessage: IMAP.IMessage) => {
          this.state.addMessageToList(inMessage);
        });
      }.bind(inParentComponent),

      //clear current displayed message
      clearMessages: function (): void {
        console.log("C/state.clearMessages()");

        this.setState(() => ({ messages: [] }));
      }.bind(inParentComponent),

      //
      addMessageToList: function (inMessage: IMAP.IMessage): void {
        console.log("C/state.addMessageToList()", inMessage);

        this.setState((prevState) => ({
          messages: [...prevState.messages, inMessage],
        }));
      }.bind(inParentComponent),

      //--method for contactList.tsx
      showContact: function (
        inID: string,
        inName: string,
        inEmail: string
      ): void {
        console.log("C/state.showContact()", inID, inName, inEmail);

        this.setState(() => ({
          currentView: "contact",
          contactID: inID,
          contactName: inName,
          contactEmail: inEmail,
        }));
      }.bind(inParentComponent),

      //--method for contactView.tsx
      fieldChangeHandler: function (inEvent: any): void {
        console.log(
          "C/state.fieldChangeHandler()",
          inEvent.target.id,
          inEvent.target.value
        );

        // Enforce max length <16 for contact name.
        if (
          inEvent.target.id === "contactName" &&
          inEvent.target.value.length > 16
        ) {
          return;
        }

        this.setState(() => ({ [inEvent.target.id]: inEvent.target.value }));
      }.bind(inParentComponent),

      //
      saveContact: async function (): Promise<void> {
        console.log(
          "C/state.saveContact()",
          this.state.contactID,
          this.state.contactName,
          this.state.contactEmail
        );
        // Copy list.
        const cl = this.state.contacts.slice(0);
        // Save to server.
        this.state.showHidePleaseWait(true);
        const contactsWorker: Contacts.Worker = new Contacts.Worker();
        const contact: Contacts.IContact = await contactsWorker.addContact({
          name: this.state.contactName,
          email: this.state.contactEmail,
        });
        this.state.showHidePleaseWait(false);
        // Add to list.
        cl.push(contact);
        // Update state.
        this.setState(() => ({
          contacts: cl,
          contactID: null,
          contactName: "",
          contactEmail: "",
        }));
      }.bind(inParentComponent),

      //
      deleteContact: async function (): Promise<void> {
        console.log("C/state.deleteContact()", this.state.contactID);

        // Delete from server.
        this.state.showHidePleaseWait(true);
        const contactsWorker: Contacts.Worker = new Contacts.Worker();
        await contactsWorker.deleteContact(this.state.contactID);
        this.state.showHidePleaseWait(false);
        // Remove from list.
        const cl = this.state.contacts.filter(
          (inElement) => inElement._id != this.state.contactID
        );
        // Update state.
        this.setState(() => ({
          contacts: cl,
          contactID: null,
          contactName: "",
          contactEmail: "",
        }));
      }.bind(inParentComponent),

      //for currentView
      updateContact: async function (this: any): Promise<void> {
        console.log("C/state.updateContact()", this.state.contactID);

        // Update on server
        this.state.showHidePleaseWait(true);
        const contactsWorker = new Contacts.Worker();

        const contact: Contacts.IContact = await contactsWorker.updateContact({
          _id: this.state.contactID,
          name: this.state.contactName,
          email: this.state.contactEmail,
        });
        this.state.showHidePleaseWait(false);

        //remove from list
        const cl = this.state.contacts.slice(0);
        const new_cl = this.state.contacts.filter(
          (inElement: Contacts.IContact) =>
            inElement._id != this.state.contactID
        );
        //push back to get new list
        new_cl.push(contact);
        // Update state.
        this.setState(() => ({
          contacts: new_cl,
          contactID: contact._id,
          contactName: contact.name,
          contactEmail: contact.email,
        }));
      }.bind(inParentComponent),

      //--method for messageList.tsx
      showMessage: async function (inMessage: IMAP.IMessage): Promise<void> {
        console.log("C/state.showMessage()", inMessage);

        // Get the message's body.
        this.state.showHidePleaseWait(true);
        const imapWorker: IMAP.Worker = new IMAP.Worker();
        const mb: String = await imapWorker.getMessageBody(
          inMessage.id,
          this.state.currentMailbox
        );
        this.state.showHidePleaseWait(false);
        // Update state.
        this.setState(() => ({
          currentView: "message",
          messageID: inMessage.id,
          messageDate: inMessage.date,
          messageFrom: inMessage.from,
          messageTo: "",
          messageSubject: inMessage.subject,
          messageBody: mb,
        }));
      }.bind(inParentComponent),

      //--methods for messageView.tsx
      sendMessage: async function (): Promise<void> {
        console.log(
          "C/state.sendMessage()",
          this.state.messageTo,
          this.state.messageFrom,
          this.state.messageSubject,
          this.state.messageBody
        );

        // Send the message.
        this.state.showHidePleaseWait(true);
        const smtpWorker: SMTP.Worker = new SMTP.Worker();
        await smtpWorker.sendMessage(
          this.state.messageTo,
          this.state.messageFrom,
          this.state.messageSubject,
          this.state.messageBody
        );
        this.state.showHidePleaseWait(false);
        // Update state.
        this.setState(() => ({ currentView: "welcome" }));
      }.bind(inParentComponent),

      //
      deleteMessage: async function (): Promise<void> {
        console.log("C/state.deleteMessage()", this.state.messageID);

        // Delete from server.
        this.state.showHidePleaseWait(true);
        const imapWorker: IMAP.Worker = new IMAP.Worker();
        await imapWorker.deleteMessage(
          this.state.messageID,
          this.state.currentMailbox
        );
        this.state.showHidePleaseWait(false);
        // Remove from list.
        const cl = this.state.messages.filter(
          (inElement) => inElement.id != this.state.messageID
        );
        // Update state.
        this.setState(() => ({ messages: cl, currentView: "welcome" }));
      }.bind(inParentComponent),
    };
  }
  return stateSingleton;
}

export function getState(): any {
  return stateSingleton;
}
