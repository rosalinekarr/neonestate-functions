/**
 * This file was auto-generated by openapi-typescript.
 * Do not make direct changes to the file.
 */

export interface paths {
    "/events": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Listen for server events
         * @description Listen for any new database updates from the server.
         *
         */
        get: operations["listenEvents"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/posts": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Fetch a collection of posts
         * @description Fetch a collection of posts given the provided filters and sorting. By default, only 25 records will be returned at a time along with a cursor to fetch more.
         *
         */
        get: operations["getPosts"];
        put?: never;
        /**
         * Create a post
         * @description Create a post with the given properties.
         *
         */
        post: operations["createPost"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/profile": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Fetch the current user
         * @description Fetch the user associated with the current authorization token.
         *
         */
        get: operations["getProfile"];
        put?: never;
        /**
         * Update the current user
         * @description Update the user associated with the current authorization token with the provided properties.
         *
         */
        post: operations["updateProfile"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/rooms": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Fetch a collection of rooms
         * @description Fetch a collection of rooms given the provided filters and sorting. By default, only 25 records will be returned at a time along with a cursor to fetch more.
         *
         */
        get: operations["getRooms"];
        put?: never;
        /**
         * Create a room
         * @description Create a room with the given properties.
         *
         */
        post: operations["createRoom"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/rooms/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Fetch a room
         * @description Fetch the room with the given id.
         *
         */
        get: operations["getRoom"];
        /**
         * Update room
         * @description Update the given room with the provided properties.
         *
         */
        put: operations["updateRoom"];
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/users": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Fetch a collection of users
         * @description Fetch a collection of users given the provided filters.
         *
         */
        get: operations["getUsers"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/users/{id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /**
         * Fetch a user
         * @description Fetch a user with the given id.
         *
         */
        get: operations["getUser"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
}
export type webhooks = Record<string, never>;
export interface components {
    schemas: {
        Error: {
            error?: string;
        };
        Post: components["schemas"]["Record"] & {
            sections?: (components["schemas"]["PostAttachmentSection"] | components["schemas"]["PostTextSection"])[];
        };
        PostAttachmentSection: {
            /** Format: uuid */
            id?: string;
            /**
             * @description discriminator enum property added by openapi-typescript
             * @enum {string}
             */
            type: "attachment";
            path?: string;
        };
        PostTextSection: {
            /** Format: uuid */
            id?: string;
            /**
             * @description discriminator enum property added by openapi-typescript
             * @enum {string}
             */
            type: "text";
            body?: string;
        };
        Record: {
            /** Format: uuid */
            id?: string;
            createdAt?: number;
            deletedAt?: number;
            updatedAt?: number;
        };
        Room: components["schemas"]["Record"] & {
            backgroundPath?: string;
            description?: string;
            name?: string;
        };
        User: components["schemas"]["Record"] & {
            username?: string;
        };
    };
    responses: {
        /** @description Unauthorized */
        Unauthorized: {
            headers: {
                [name: string]: unknown;
            };
            content: {
                "application/json": components["schemas"]["Error"];
            };
        };
        /** @description Server error */
        ServerError: {
            headers: {
                [name: string]: unknown;
            };
            content: {
                "application/json": components["schemas"]["Error"];
            };
        };
    };
    parameters: never;
    requestBodies: never;
    headers: never;
    pathItems: never;
}
export type $defs = Record<string, never>;
export interface operations {
    listenEvents: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            401: components["responses"]["Unauthorized"];
            500: components["responses"]["ServerError"];
        };
    };
    getPosts: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Post"][];
                };
            };
            401: components["responses"]["Unauthorized"];
            500: components["responses"]["ServerError"];
        };
    };
    createPost: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Post"];
                };
            };
            401: components["responses"]["Unauthorized"];
            500: components["responses"]["ServerError"];
        };
    };
    getProfile: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["User"];
                };
            };
            401: components["responses"]["Unauthorized"];
            500: components["responses"]["ServerError"];
        };
    };
    updateProfile: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["User"];
                };
            };
            401: components["responses"]["Unauthorized"];
            500: components["responses"]["ServerError"];
        };
    };
    getRooms: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Room"][];
                };
            };
            401: components["responses"]["Unauthorized"];
            500: components["responses"]["ServerError"];
        };
    };
    createRoom: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Room"];
                };
            };
            401: components["responses"]["Unauthorized"];
            500: components["responses"]["ServerError"];
        };
    };
    getRoom: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /** @description Room ID */
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Room"];
                };
            };
            401: components["responses"]["Unauthorized"];
            500: components["responses"]["ServerError"];
        };
    };
    updateRoom: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /** @description Room ID */
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Room"];
                };
            };
            401: components["responses"]["Unauthorized"];
            500: components["responses"]["ServerError"];
        };
    };
    getUsers: {
        parameters: {
            query?: {
                /** @description Phone Number of the user to find */
                phoneNumber?: string;
                /** @description Username of the user to find */
                username?: string;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["User"][];
                };
            };
            401: components["responses"]["Unauthorized"];
            500: components["responses"]["ServerError"];
        };
    };
    getUser: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                /** @description User ID */
                id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description OK */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["User"];
                };
            };
            401: components["responses"]["Unauthorized"];
            500: components["responses"]["ServerError"];
        };
    };
}
