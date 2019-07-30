/**
 * The recognized set of messages that are sent from the host to the client. Internal use only.
 */
export declare enum ChattyHostMessages {
    SynAck = 0,
    Message = 1,
    MessageWithResponse = 2,
    Response = 3
}
