import { Callback, CallbackStore } from './types';
import { ChattyHost } from './host';
/**
 * Provides methods to define the properties of a [[ChattyHost]]
 */
export declare class ChattyHostBuilder {
    private _url;
    private _appendTo;
    private _handlers;
    private _sandboxAttrs;
    private _frameBorder;
    private _targetOrigin;
    private _defaultTimeout;
    constructor(_url: string);
    readonly el: HTMLElement;
    readonly handlers: CallbackStore;
    readonly sandboxAttrs: string[];
    readonly targetOrigin: string | null;
    readonly url: string;
    readonly defaultTimeout: number;
    /**
     * @param el the HTML element that the iframe will live inside. The iframe will be created as
     * a direct child of the element.
     */
    appendTo(el: HTMLElement): this;
    /**
     * Removes an event handler to the host.
     *
     * @param name Event name
     * @param fn Callback function to remove.
     */
    off(name: string, fn: Callback): void;
    /**
     * Adds an event handler to the host.
     *
     * @param name Event name to which to listen.
     * @param fn Callback function that is invoked when the event
     * is received, and accepts any parameters that were passed with the event.
     */
    on(name: string, fn: Callback): this;
    withDefaultTimeout(timeout: number): this;
    getFrameBorder(): string;
    frameBorder(attr: string): this;
    sandbox(attr: string): this;
    withTargetOrigin(targetOrigin: string): this;
    /**
     * Builds a [[ChattyHost]] with the provided properties.
     */
    build(): ChattyHost;
}
