class ChatDB {
    constructor() {
        this.db = null;
        this.initialize();
    }

    initialize() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open("ChatDatabase", 1);

            request.onupgradeneeded = (event) => {
                this.db = event.target.result;

                if (!this.db.objectStoreNames.contains("conversations")) {
                    const store = this.db.createObjectStore("conversations", {
                        keyPath: "id",
                        autoIncrement: true,
                    });
                    store.createIndex("createdAt", "createdAt", {
                        unique: false,
                    });
                }

                if (!this.db.objectStoreNames.contains("messages")) {
                    const store = this.db.createObjectStore("messages", {
                        keyPath: "id",
                    });
                    store.createIndex("conversationId", "conversationId", {
                        unique: false,
                    });
                }
            };

            request.onsuccess = (event) => {
                this.db = event.target.result;
                resolve();
            };

            request.onerror = (event) => {
                reject(event.target.error);
            };
        });
    }

    // 对话操作
    async getConversations() {
        return this.getAll("conversations");
    }

    async createConversation(title = "新对话") {
        const conversation = {
            title,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };
        return this.add("conversations", conversation);
    }

    async deleteConversation(id) {
        const tx = this.db.transaction(
            ["conversations", "messages"],
            "readwrite"
        );
        tx.objectStore("conversations").delete(id);
        tx.objectStore("messages").delete(
            IDBKeyRange.bound([id], [id, "\uffff"])
        );
        return this.completeTransaction(tx);
    }

    // 消息操作
    async getMessages(conversationId) {
        return this.getAll(
            "messages",
            IDBKeyRange.bound([conversationId], [conversationId, "\uffff"])
        );
    }

    async saveMessage(conversationId, message) {
        const messageWithId = {
            ...message,
            id: `${conversationId}-${Date.now()}`,
            conversationId,
            timestamp: new Date().toISOString(),
        };
        return this.add("messages", messageWithId);
    }

    // 通用方法
    getAll(storeName, query) {
        return new Promise((resolve, reject) => {
            const tx = this.db.transaction(storeName, "readonly");
            const store = tx.objectStore(storeName);
            const request = query ? store.getAll(query) : store.getAll();

            request.onsuccess = () => resolve(request.result);
            request.onerror = (e) => reject(e.target.error);
        });
    }

    add(storeName, data) {
        return new Promise((resolve, reject) => {
            const tx = this.db.transaction(storeName, "readwrite");
            const store = tx.objectStore(storeName);
            const request = store.add(data);

            request.onsuccess = () => resolve(request.result);
            request.onerror = (e) => reject(e.target.error);
        });
    }

    completeTransaction(tx) {
        return new Promise((resolve, reject) => {
            tx.oncomplete = () => resolve();
            tx.onerror = (e) => reject(e.target.error);
        });
    }
}

export const chatDB = new ChatDB();
