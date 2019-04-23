/**
 * Defines a general purpose callback method used to respond to events.
 */
export declare type Callback = (...args: any[]) => any;
/**
 * A container for callback methods indexed by event name.
 */
export declare type CallbackStore = {
    [name: string]: Callback[];
};
/**
 * A container for generic methods
 *
 * @deprecated Replaced by ChattyHostConnection and ChattyClientConnection
 */
export declare type MethodStore = {
    [name: string]: (...args: any[]) => any;
};
