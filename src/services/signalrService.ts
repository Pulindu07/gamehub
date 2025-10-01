// placeholder to be replaced by real SignalR client
export const signalR = {
    connect: async () => {
    console.log('signalR connect placeholder')
    return Promise.resolve()
    },
    on: (event: string, cb: (...args:any[])=>void) => {
    console.log('register', event)
    },
    off: (event:string) => {},
    send: (ev:string, payload?:any) => {
    console.log('send', ev, payload)
    }
    }