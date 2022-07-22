import feathers from "@feathersjs/feathers";
import "@feathersjs/transport-commons";
import express from "@feathersjs/express";
import { Request, Response } from "express";
import socketio from "@feathersjs/socketio";
import pug from "pug";
import { status } from "minecraft-server-util";
import mcserver from "./mcserver.json";
import path from "path";

// This is the interface for the message data
interface Message {
  id?: number;
  text: string;
  sender: string;
}

// A messages service that allows to create new
// and return all existing messages
class MessageService {
  messages: Message[] = [];

  async find() {
    // Just return all our messages
    return this.messages;
  }

  async create(data: Pick<Message, "text" | "sender">) {
    // The new message is the data text with a unique identifier added
    // using the messages length since it changes whenever we add one
    const message: Message = {
      id: this.messages.length,
      ...data,
    };

    // Add new message to the list
    this.messages.push(message);

    return message;
  }
}

// Creates an ExpressJS compatible Feathers application
const app = express(feathers());

// Express middleware to parse HTTP JSON bodies
app.use(express.json());
// Express middleware to parse URL-encoded params
app.use(express.urlencoded({ extended: true }));
// Express middleware to to host static files from the static folder
app.use(express.static(path.join(__dirname, "/static/")));
// Add REST API support
app.configure(express.rest());
// Configure Socket.io real-time APIs
app.configure(socketio());
// Register our messages service
app.use("/messages", new MessageService());
// Express middleware with a nicer error handler
app.use(express.errorHandler());

//const index = pug.compileFile("index.pug");
const index = (opts: pug.Options & pug.LocalsObject) =>
  pug.renderFile("index.pug", opts);

app.use(/(index)?/i, async (_req: Request, res: Response) => {
  // const liveInfo = await status(mcserver.host, mcserver.port);
  //res.send(index({ ...liveInfo.players }));
  res.send(
    index({
      players: 2,
      max: 36,
      sample: [{ name: "Jim" }, { name: "garfield" }],
    })
  );
});

// Add any new real-time connection to the `everybody` channel
app.on("connection", (connection) => app.channel("everybody").join(connection));
// Publish all events to the `everybody` channel
app.publish((data) => app.channel("everybody"));

// Start the server
app
  .listen(3030)
  .on("listening", () =>
    console.log("Feathers server listening on localhost:3030")
  );

// For good measure let's create a message
// So our API doesn't look so empty
app.service("messages").create({
  text: "Hello world from the server",
  sender: "admin",
});
