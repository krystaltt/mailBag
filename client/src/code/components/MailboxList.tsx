// React imports.
import React from "react";

// Material-UI imports.
import Chip from "@mui/material/Chip";
import List from "@mui/material/List";

const MailboxList = ({ state }): JSX.Element => (
  <List>
    {state.mailboxes.map((value) => {
      // Skip rendering a specific value in mailboxes
      if (value.name === "[Gmail]") {
        return null; // Skip rendering this value
      }
      return (
        <Chip
          label={`${value.name}`}
          onClick={() => state.setCurrentMailbox(value.path)}
          style={{ width: 128, marginBottom: 10 }}
          color={state.currentMailbox === value.path ? "secondary" : "primary"}
        />
      );
    })}
  </List>
); /* Mailboxes. */

export default MailboxList;
