import { ChattyHostBuilder } from './host_builder';
import 'es6-promise/auto';
/**
 * @private
 * Host connection status
 */
export declare enum ChattyHostStates {
    Connecting = 0,
    SynAck = 1,
    Connected = 2
}
/**
 * The Host connection to the client.
 */
export declare type ChattyHostConnection = {
    /**
     * @param eventName The name of the event to send to the client
     * @param payload Additional data to send to the client. Restricted to transferable objects, ownership of the
     * object will be transferred to the client.
     */
    send(eventName: string, ...payload: any[]): void;
    sendAndReceive(eventName: string, ...payload: any[]): Promise<any>;
};
/**
 * The host object for an iframe. The user should not create this object directly, it
 * is returned by the `ChattyClientBuilder.build()` method.
 */
export declare class ChattyHost {
    private static _debug;
    /**
     * The underlying iframe element
     */
    iframe: HTMLIFrameElement;
    private _hostWindow;
    private _appendTo;
    private _connection;
    private _port;
    private _handlers;
    private _targetOrigin;
    private _state;
    private _defaultTimeout;
    private _sequence;
    private _receivers;
    /**
     * @param builder The client builder that is responsible for constructing this object.
     * @hidden
     */
    constructor(builder: ChattyHostBuilder);
    /**
     * @returns a Promise to an object that resolves when the client initiates the connection.
     */
    readonly connection: Promise<ChattyHostConnection> | null;
    /**
     * @returns a flag indicating whether the client successfully connected to the host.
     */
    readonly isConnected: boolean;
    /**
     * Connects to the client iframe. Waits for the client iframe to load and initiate a
     * connection using the chatty client.
     *
     * @returns a Promise to an object that resolves when the client has initiated the connection. The
     * object contains a `send(message, data)` method that can be used to talk to the host.
     */
    connect(): Promise<ChattyHostConnection>;
    private sendMsg;
    private isValidMsg;
}
