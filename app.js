const mongoose = require("mongoose")
const express = require("express")
const { connectDB } = require("./connectDB.js")
const { populatePokemons } = require("./populatePokemons.js")
const { getTypes } = require("./getTypes.js")
const { handleErr } = require("./errorHandler.js")
const bodyparser = require("body-parser");
const app = express()
const port = 5000
var pokeModel = null;

class PokemonBadRequest extends Error {
  constructor(message) {
    super(message); // (1)
    this.name = "PokemonBadRequest"; // (2)
  }
}

class PokemonBadRequestMissingID extends PokemonBadRequest {
  constructor(message) {
    super(message); // (1)
    this.name = "PokemonBadRequestMissingID"; // (2)
  }
}

class PokemonNoutFound extends Error {
  constructor(message) {
    super(message); // (1)
    this.name = "PokemonNotFound"; // (2)
  }
}

class PokemonDBError extends Error {
  constructor(message) {
    super(message); // (1)
    this.name = "PokemonDBError"; // (2)
  }
}

class PokemonNullRequestError extends Error {
  constructor(message) {
    super(message); // (1)
    this.name = "PokemonDBError"; // (2)
  }
}

const start = async () => {
  // console.log("starting the server");
  await connectDB();
  const pokeSchema = await getTypes();
  pokeModel = await populatePokemons(pokeSchema);

  app.listen(port, (err) => {
    // console.log("app.listen started");
    if (err) console.log(err);
    else
      console.log(`Phew! Server is running on port: ${port}`);
  })
}
start()

const asyncWrapper = (fn) => {
  return async (req, res, next) => {
    try {
      await fn(req, res, next)
    } catch (error) {
      next(error)
    }
  }
}

app.use(bodyparser.urlencoded({
  extended: true
}));


app.use((err, req, res, next) => {
  if (err instanceof PokemonBadRequestMissingAfter) {
    res.status(400).send(err.message);
  } else if (err instanceof PokemonBadRequestMissingID) {
    res.status(400).send(err.message);
  } else {
    res.status(500).send(err.message);
  }
})

app.get('/api/v1/pokemons', asyncWrapper(async (req, res) => {
  console.log("GET /api/v1/pokemons");
  if (!req.query["count"])
    req.query["count"] = 10
  if (!req.query["after"])
    req.query["after"] = 0
  try {
    const docs = await pokeModel.find({})
      .sort({ "id": 1 })
      .skip(req.query["after"])
      .limit(req.query["count"])
    res.json(docs)
  } catch (err) { next(new PokemonNullRequestError('After and count must be integers'));}
}))

app.get('/api/v1/pokemon/:id', asyncWrapper (async (req, res, next) => {
  try {
    const { id } = req.params
    const docs = await pokeModel.find({ "id": id })
    if (docs.length != 0) res.json(docs)
    else if (req.query.id === undefined) 
      return next(new PokemonBadRequestMissingID('Missing ID'));
  } catch (err) {return next(new PokemonBadRequestMissingID('Missing ID')); }
}))

app.use(express.json())

app.post('/api/v1/pokemon/', asyncWrapper(async (req, res, next) => {
  try {
    const pokeDoc = await pokeModel.create(req.body)
    // console.log(pokeDoc);
    res.json({
      msg: "Added Successfully"
    })
  } catch (err) { return next(new PokemonDBError('Pokemon DB Error')); }
}))

app.delete('/api/v1/pokemon/:id', asyncWrapper(async (req, res) => {
  try {
    const docs = await pokeModel.findOneAndRemove({ id: req.params.id })
    if (docs)
      res.json({
        msg: "Deleted Successfully"
      })
    else
    return next(new PokemonNoutFound('Pokemon Not Found'));
  } catch (err) { return next(new PokemonNoutFound('Pokemon Not Found')); }
}))

app.put('/api/v1/pokemon/:id', asyncWrapper(async (req, res) => {
  try {
    const selection = { id: req.params.id }
    const update = req.body
    const options = {
      new: true,
      runValidators: true,
      overwrite: true
    }
    const doc = await pokeModel.findOneAndUpdate(selection, update, options)
    // console.log(docs);
    if (doc) {
      res.json({
        msg: "Updated Successfully",
        pokeInfo: doc
      })
    } else {
      return next(new PokemonNoutFound('Pokemon Not Found'))
    }
  } catch (err) { return next(new PokemonNoutFound('Pokemon Not Found')) }
}))

app.patch('/api/v1/pokemon/:id', asyncWrapper(async (req, res) => {
  try {
    const selection = { id: req.params.id }
    const update = req.body
    const options = {
      new: true,
      runValidators: true
    }
    const doc = await pokeModel.findOneAndUpdate(selection, update, options)
    if (doc) {
      res.json({
        msg: "Updated Successfully",
        pokeInfo: doc
      })
    } else {
      return new PokemonNoutFound('Pokemon Not Found')
    }
  } catch (err) { }
}))

app.get("*", (req, res) => {
  res.json({
    msg: "Improper route. Check API docs plz."
  })
})