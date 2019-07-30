/**
 * The recognized set of events that are sent from the client to the host. Internal use only.
 */
export declare enum ChattyClientMessages {
    Syn = 0,
    Ack = 1,
    Message = 2,
    MessageWithResponse = 3,
    Response = 4
}
