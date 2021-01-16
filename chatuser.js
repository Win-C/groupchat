/** Functionality related to chatting. */

// Room is an abstraction of a chat channel
const Room = require("./Room");

const JOKE = "Today, my son asked 'Can I have a book mark?' and I burst into tears. 11 years old and he still doesn't know my name is Brian.";

/** ChatUser is a individual connection from client -> server to chat. */

class ChatUser {
  /** Make chat user: store connection-device, room.
   *
   * @param send {function} callback to send message to this user
   * @param room {Room} room user will be in
   * */

  constructor(send, roomName) {
    this._send = send; // "send" function for this user
    this.room = Room.get(roomName); // room user will be in
    this.name = null; // becomes the username of the visitor

    console.log(`created chat in ${this.room.name}`);
  }

  /** Send msgs to this client using underlying connection-send-function.
   *
   * @param data {string} message to send
   * */

  send(data) {
    try {
      this._send(data);
    } catch {
      // If trying to send to a user fails, ignore it
    }
  }

  /** Handle joining: add to room members, announce join.
   *
   * @param name {string} name to use in room
   * */

  handleJoin(name) {
    this.name = name;
    this.room.join(this);
    this.room.broadcast({
      type: "note",
      text: `${this.name} joined "${this.room.name}".`,
    });
  }

  /** Handle a chat: broadcast to room.
   *
   * @param text {string} message to send
   * */

  handleChat(text) {
    this.room.broadcast({
      name: this.name,
      type: "chat",
      text: text,
    });
  }

  /** Handle a get joke: broadcast to user.
   *
   * @param text {string} joke to send
   * */

  handleGetJoke() {
    // QUESTION: should we be using this.send or this._send?
    this.send(JSON.stringify({
      name: "server",
      type: "joke",
      text: JOKE,
    }));
  }

  /** Handle get members: broadcast to user.
   *
   * @param text {string} member list string to send
   * */

  handleGetMembers() {
    this.send(JSON.stringify({
      name: "server",
      type: "members",
      text: this.room.getMembers(),
    }));
  }

  /** Handle messages from client:
   *
   * @param jsonData {string} raw message data
   *
   * @example<code>
   * - {type: "join", name: username} : join
   * - {type: "joke", text: joke, name: "Server" } : joke
   * - {type: "chat", text: msg }     : chat
   * </code>
   */

  handleMessage(jsonData) {
    let msg = JSON.parse(jsonData);
    if (msg.type === "join") this.handleJoin(msg.name);
    else if (msg.type === "joke") this.handleGetJoke();
    else if (msg.type === "chat") this.handleChat(msg.text);
    else if (msg.type === "members") this.handleGetMembers();
    else throw new Error(`bad message: ${msg.type}`);
  }

  /** Connection was closed: leave room, announce exit to others. */

  handleClose() {
    this.room.leave(this);
    this.room.broadcast({
      type: "note",
      text: `${this.name} left ${this.room.name}.`,
    });
  }
}

module.exports = ChatUser;
