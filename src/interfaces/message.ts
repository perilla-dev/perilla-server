export enum IPCMessageType {
    FileGCRequest,
    SendMailRequest,
}

export interface IPCMessage {
    type: IPCMessageType;
    payload: any;
}
