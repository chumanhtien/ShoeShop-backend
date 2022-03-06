import express from "express";
import asyncHandler from "express-async-handler"
import users from './data/users.js';
import User from './Models/UserModel.js';
import Product from './Models/ProductModel.js';
import products from "./data/Products.js";
const ImportData = express.Router();

ImportData.post(
    "/user", 
    asyncHandler(async (req, res) => {
        await User.remove({});
        // remove(): remove all document in collection in insert new 
        const importUser = await User.insertMany(users);
        res.send({importUser});
    })
);

ImportData.post(
    "/products", 
    asyncHandler(async (req, res) => {
        await Product.remove({});
        const importProduct = await Product.insertMany(products);
        res.send({importProduct})
    })
);

export default ImportData;