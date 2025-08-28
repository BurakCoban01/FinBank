// File: fintrack-client/src/types/user.ts

// Backend'deki UserDto'ya karşılık gelen tip
export interface User {
    id: number;
    username: string;
    email: string;
    firstName: string;
    lastName: string;
    createdAt: string;
}

// Backend'deki LoginDto'ya karşılık gelen tip
export interface LoginData {
    email: string;
    password: string;
}

// Backend'deki RegisterDto'ya karşılık gelen tip
export interface RegisterData {
    username: string;
    email: string;
    password: string;
    firstName?: string;
    lastName?: string;
}