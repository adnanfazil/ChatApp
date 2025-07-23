import { createSlice } from "@reduxjs/toolkit";

const messageSlice = createSlice({
    name: "message",
    initialState: {
        message: [],
        newMessageId: "",
        messageStats: {
            total: 0,
            text: 0,
            image: 0,
            video: 0,
            audio: 0,
            file: 0
        },
        pagination: {
            currentPage: 1,
            totalPages: 1,
            hasMore: false
        }
    },
    reducers: {
        addAllMessages: (state, action) => {
            state.message = action.payload;
            // Update stats
            state.messageStats = action.payload.reduce((stats, msg) => {
                const type = msg.messageType || 'text';
                stats.total++;
                stats[type] = (stats[type] || 0) + 1;
                return stats;
            }, {
                total: 0,
                text: 0,
                image: 0,
                video: 0,
                audio: 0,
                file: 0
            });
        },
        addNewMessage: (state, action) => {
            const newMessage = action.payload;
            state.message = [...state.message, newMessage];
            
            // Update stats
            const messageType = newMessage.messageType || 'text';
            state.messageStats.total++;
            state.messageStats[messageType] = (state.messageStats[messageType] || 0) + 1;
        },
        addNewMessageId: (state, action) => {
            state.newMessageId = action.payload;
        },
        updateMessage: (state, action) => {
            const { messageId, updates } = action.payload;
            const messageIndex = state.message.findIndex(msg => msg._id === messageId);
            if (messageIndex !== -1) {
                state.message[messageIndex] = { ...state.message[messageIndex], ...updates };
            }
        },
        deleteMessage: (state, action) => {
            const messageId = action.payload;
            const messageIndex = state.message.findIndex(msg => msg._id === messageId);
            if (messageIndex !== -1) {
                const deletedMessage = state.message[messageIndex];
                const messageType = deletedMessage.messageType || 'text';
                
                // Update stats
                state.messageStats.total--;
                state.messageStats[messageType] = Math.max(0, (state.messageStats[messageType] || 0) - 1);
                
                // Remove message
                state.message.splice(messageIndex, 1);
            }
        },
        clearMessages: (state) => {
            state.message = [];
            state.messageStats = {
                total: 0,
                text: 0,
                image: 0,
                video: 0,
                audio: 0,
                file: 0
            };
        },
        updatePagination: (state, action) => {
            state.pagination = { ...state.pagination, ...action.payload };
        },
        prependMessages: (state, action) => {
            // For loading older messages
            const olderMessages = action.payload;
            state.message = [...olderMessages, ...state.message];
            
            // Update stats
            olderMessages.forEach(msg => {
                const messageType = msg.messageType || 'text';
                state.messageStats.total++;
                state.messageStats[messageType] = (state.messageStats[messageType] || 0) + 1;
            });
        }
    },
});

export const {
    addAllMessages,
    addNewMessage,
    addNewMessageId,
    updateMessage,
    deleteMessage,
    clearMessages,
    updatePagination,
    prependMessages
} = messageSlice.actions;

export default messageSlice.reducer;
