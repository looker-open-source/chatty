import { ChattyClientBuilder } from './client_builder';
import 'es6-promise/auto';
/**
 * @private
 * Client connection status
 */
export declare enum ChattyClientStates {
    Connecting = 0,
    Syn = 1,
    Connected = 2
}
/**
 * The client connection to the host.
 */
export declare type ChattyClientConnection = {
    /**
     * @param eventName The name of the event to send to the host
     * @param payload Additional data to send to host. Restricted to transferable objects, ownership of the
     * object will be transferred to the host.
     */
    send(eventName: string, ...payload: any[]): void;
};
/**
 * The client object for an iframe. The user should not create this object directly, it
 * is returned by the `ChattyClientBuilder.build()` method.
 */
export declare class ChattyClient {
    private static _debug;
    private _clientWindow;
    private _connection;
    private _channel;
    private _hostWindow;
    private _handlers;
    private _targetOrigin;
    private _state;
    /**
     * @param builder The client builder that is responsible for constructing this object.
     * @hidden
     */
    constructor(builder: ChattyClientBuilder);
    /**
     * @returns a Promise to an object that resolves when the host has acknowledged the connection.
     */
    readonly connection: Promise<ChattyClientConnection> | null;
    /**
     * @returns a flag indicating whether the client has successfully connected to the host.
     */
    readonly isConnected: boolean;
    /**
     * Connects to the host window.
     * @returns a Promise to an object that resolves when the host has acknowledged the connection. The
     * object contains a `send(message, data)` method that can be used to talk to the host.
     */
    connect(): Promise<ChattyClientConnection>;
    private initiateHandshake;
    private sendMsg;
}
