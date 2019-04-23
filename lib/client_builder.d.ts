import { Callback, CallbackStore } from './types';
import { ChattyClient } from './client';
/**
 * Provides methods to defined the properties of a [[ChattyClient]]
 */
export declare class ChattyClientBuilder {
    private _targetOrigin;
    private _handlers;
    readonly targetOrigin: string;
    readonly handlers: CallbackStore;
    /**
     * Removes an event handler to the client.
     *
     * @param name Event name
     * @param fn Callback function to remove
     * @returns the client builder
     */
    off(name: string, fn: Callback): void;
    /**
     * Adds an event handler to the client.
     *
     * @param name Event name to which to listen.
     * @param fn Callback function that is invoked when the event
     * is received, and accepts any parameters that were passed with the event.
     * @returns the client builder
     */
    on(name: string, fn: Callback): this;
    /**
     * Optional. Sets the target origin parameter used to communicate with the host. Default
     * is '*'. If possible it should be set the the host window's origin.
     *
     * @param targetOrigin targetOrigin to use with postMessage()
     * @returns the client builder
     */
    withTargetOrigin(targetOrigin: string): this;
    /**
     * Builds a [[ChattyClient]] with the provided properties.
     * @returns a new Chatty client.
     */
    build(): ChattyClient;
}
