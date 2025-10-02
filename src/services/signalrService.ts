import * as signalR from "@microsoft/signalr"
import { store } from "../store"
import { setBoard, setMultiplayerBoard } from "../store/game/gameSlice"

class SignalRService {
  private connection: signalR.HubConnection | null = null

  async start(gameId: string) {
    this.connection = new signalR.HubConnectionBuilder()
      .withUrl("http://localhost:5197/memoryHub")
      .withAutomaticReconnect()
      .build()

    this.connection.on("BoardUpdated", (board) => {
      store.dispatch(setMultiplayerBoard(board))
    })

    await this.connection.start()
    await this.connection.invoke("JoinGame", gameId)
  }

  sendFlip(index: number) {
    if (!this.connection) return
    this.connection.invoke("FlipCard", index)
  }
}

export const signalRService = new SignalRService()
