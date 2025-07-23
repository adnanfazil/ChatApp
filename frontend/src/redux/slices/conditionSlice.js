import { createSlice } from "@reduxjs/toolkit";

const conditionSlice = createSlice({
    name: "condition",
    initialState: {
        isLoading: false,
        isChatLoading: false,
        isMessageLoading: false,
        isSendLoading: false,
        isProfileDetail: false,
        isHeaderMenu: false,
        isChatDetailsBox: false,
        isUserSearchBox: false,
        isGroupChatBox: false,
        isGroupChatId: "",
        isSocketConnected: false,
        isTyping: false,
        isNotificationBox: false,
        // File upload states
        isFileUploading: false,
        fileUploadProgress: 0,
        fileUploadError: null,
        // User status tracking
        userStatuses: {}, // { userId: { isOnline: boolean, lastSeen: Date } }
        typingUsers: [], // Array of user objects who are typing
    },
    reducers: {
        setLoading: (state, action) => {
            state.isLoading = action.payload;
        },
        setChatLoading: (state, action) => {
            state.isChatLoading = action.payload;
        },
        setMessageLoading: (state, action) => {
            state.isMessageLoading = action.payload;
        },
        setSendLoading: (state, action) => {
            state.isSendLoading = action.payload;
        },
        setProfileDetail: (state) => {
            state.isProfileDetail = !state.isProfileDetail;
        },
        setHeaderMenu: (state, action) => {
            state.isHeaderMenu = action.payload;
            state.isChatDetailsBox = false;
        },
        setChatDetailsBox: (state, action) => {
            state.isHeaderMenu = false;
            state.isChatDetailsBox = action.payload;
        },
        setUserSearchBox: (state) => {
            state.isUserSearchBox = !state.isUserSearchBox;
        },
        setGroupChatBox: (state) => {
            state.isGroupChatBox = !state.isGroupChatBox;
        },
        setGroupChatId: (state, action) => {
            state.isGroupChatId = action.payload;
        },
        setSocketConnected: (state, action) => {
            state.isSocketConnected = action.payload;
        },
        setTyping: (state, action) => {
            state.isTyping = action.payload;
        },
        setNotificationBox: (state, action) => {
            state.isNotificationBox = action.payload;
        },
        // File upload actions
        setFileUploading: (state, action) => {
            state.isFileUploading = action.payload;
        },
        setFileUploadProgress: (state, action) => {
            state.fileUploadProgress = action.payload;
        },
        setFileUploadError: (state, action) => {
            state.fileUploadError = action.payload;
        },
        resetFileUpload: (state) => {
            state.isFileUploading = false;
            state.fileUploadProgress = 0;
            state.fileUploadError = null;
        },
        // User status actions
        updateUserStatus: (state, action) => {
            const { userId, isOnline, lastSeen } = action.payload;
            state.userStatuses[userId] = {
                isOnline,
                lastSeen: lastSeen ? new Date(lastSeen) : null
            };
        },
        updateMultipleUserStatuses: (state, action) => {
            const statusMap = action.payload;
            Object.keys(statusMap).forEach(userId => {
                state.userStatuses[userId] = {
                    isOnline: statusMap[userId].isOnline,
                    lastSeen: statusMap[userId].lastSeen ? new Date(statusMap[userId].lastSeen) : null
                };
            });
        },
        // Typing users actions
        addTypingUser: (state, action) => {
            const user = action.payload;
            const existingIndex = state.typingUsers.findIndex(u => u.userId === user.userId);
            if (existingIndex === -1) {
                state.typingUsers.push(user);
            }
        },
        removeTypingUser: (state, action) => {
            const userId = action.payload;
            state.typingUsers = state.typingUsers.filter(u => u.userId !== userId);
        },
        clearTypingUsers: (state) => {
            state.typingUsers = [];
        }
    },
});

export const {
    setLoading,
    setChatLoading,
    setMessageLoading,
    setSendLoading,
    setProfileDetail,
    setHeaderMenu,
    setChatDetailsBox,
    setUserSearchBox,
    setGroupChatBox,
    setGroupChatId,
    setSocketConnected,
    setTyping,
    setNotificationBox,
    // File upload actions
    setFileUploading,
    setFileUploadProgress,
    setFileUploadError,
    resetFileUpload,
    // User status actions
    updateUserStatus,
    updateMultipleUserStatuses,
    // Typing users actions
    addTypingUser,
    removeTypingUser,
    clearTypingUsers
} = conditionSlice.actions;

export default conditionSlice.reducer;
