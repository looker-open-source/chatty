import { ChattyClientBuilder } from './client_builder';
import { ChattyHostBuilder } from './host_builder';
export { ChattyClientBuilder } from './client_builder';
export { ChattyHostBuilder } from './host_builder';
export { ChattyClient, ChattyClientConnection } from './client';
export { ChattyHost, ChattyHostConnection } from './host';
export * from './types';
/**
 * @class Chatty
 *
 * Primary interface for chatty. Provides methods for creating the chatty hosts and clients.
 */
export declare class Chatty {
    /**
     * Creates a [[ChattyHostBuilder]] object. The builder presents a set of methods to configure
     * and construct the host object.
     *   *
     * It is up to the client's webserver to return the correct headers to allow for parent/iframe
     * communication. See
     * [Window.postMessage()](https://developer.mozilla.org/en-US/docs/Web/API/Window/postMessage)
     * for details.
     *
     * @param url The URL of the client iframe to create. The hosted iframe should create a chatty
     * client to communicate with the host.
     */
    static createHost(url: string): ChattyHostBuilder;
    /**
     * Creates a [[ChattyClientBuilder]] object. The builder presents a set of methods to configure
     * and construct the client object.
     */
    static createClient(): ChattyClientBuilder;
}
