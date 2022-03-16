import express from "express";
import asyncHandler from "express-async-handler";
import Product from "../Models/ProductModel.js";
import {admin, protect} from "../Middleware/AuthMiddleware.js"
import { PAGE_SIZE } from "../constants/PageConstants.js";

const productRoute = express.Router();
// Lay data tu mongoose db
/// Lay all products == GET ALL PRODUCTS
productRoute.get(
    "/", 
    asyncHandler (async (req, res) => {
        const pageSize = PAGE_SIZE;
        const page = Number(req.query.pageNumber) || 1;
        const keyword = req.query.keyword ? {
            name: {
                $regex: req.query.keyword,
                $options: "i",
            },
        }
        : {

        };
        const count = await Product.countDocuments({...keyword});
        const products = await Product.find({...keyword})
            .limit(pageSize)
            .skip(pageSize * (page - 1)).sort({_id: -1});
        res.json({products, page, pages: Math.ceil(count / pageSize)});
    })
);

//ADMIN GET ALL PRODUCTS WITHOUT SEARCH AND PEGINATION
productRoute.get(
    "/all", 
    protect, 
    admin, 
    asyncHandler(async (req, res)=> {
        const products = await Product.find({}).sort({_id: -1});
        res.json(products);
    })
);


//Lay 1 product theo id == GET SINGLE PRODUCT
productRoute.get(
    "/:id",
    asyncHandler(async (req, res) => {
        const product = await Product.findById(req.params.id);
        if(product) {
            res.json(product);
        } else {
            res.status(404);
            throw new Error("Product not found!");
        }
    })  
);

//PRODUCT REVIEW
productRoute.post(
    "/:id/review",
    protect,
    asyncHandler(async (req, res) => {
        const {rating, comment} = req.body;
        const product = await Product.findById(req.params.id);
        if(product) {

            //CHI REVIEW 1 LAN DUY NHAT !
            const alreadyReviewed = product.reviews.find(
                (r) => r.user.toString() === req.user._id.toString()
            )
            // if (alreadyReviewed) {
            //     res.status(400);
            //     throw new Error("Product already Reviewed");
            // } 
            const review = {
                name: req.user.name,
                rating: Number(rating),
                comment,
                user: req.user._id,
                createdAt: Date.now(),
            };
            if (alreadyReviewed) {
                product.reviews.remove(alreadyReviewed);
            } 
            product.reviews.push(review);
            product.numReviews = product.reviews.length;
            product.rating = product.reviews.reduce((acc, item) => item.rating + acc, 0) / product.reviews.length;
            
            await product.save();
            if (alreadyReviewed) {
                res.status(202).json({message: "Review has already been Updated"});
            }
            else {
                res.status(201).json({message: "Review has already beern Added"});
            }
        } else {
            res.status(404);
            throw new Error("Product not found!");
        }
    })  
);

//DELETE PRODUCT
productRoute.delete(
    "/:id",
    protect,
    admin,
    asyncHandler(async (req, res) => {
        const product = await Product.findById(req.params.id);
        if(product) {
            await product.remove();
            res.json({message: "Product has already been deleted"});
        } else {
            res.status(404);
            throw new Error("Product not found!");
        }
    })  
);


//CREATE PRODUCT
productRoute.post(
    "/",
    protect,
    admin,
    asyncHandler(async (req, res) => {
        const {name, price, description, image, countInStock} = req.body;
        const productExist = await Product.findOne({name});
        if(productExist) {
            res.status(400);
            throw new Error("Product name already exist!");
        } else {
            const product = new Product({
                name, 
                price, 
                description, 
                image, 
                countInStock,
                user: req.user._id,
            })
            if (product) {
                const createdproduct = await product.save();
                res.status(201).json(createdproduct);
            }
            else {
                res.status(400);
                throw new Error("Invalid product data");
            }
            
        }
    })  
);

//EDIT/UPDATE PRODUCT
productRoute.put(
    "/:id",
    protect,
    admin,
    asyncHandler(async (req, res) => {
        const {name, price, description, image, countInStock} = req.body;
        const product = await Product.findById(req.params.id);
        if(product) {
            product.name = name || product.name; 
            product.price = price || product.price; 
            product.description = description || product.description; 
            product.image = image || product.image; 
            product.countInStock = countInStock || product.countInStock;

            const updatedProduct = await product.save();
            res.status(201).json(updatedProduct);
        } else {
            res.status(404);
            throw new Error("Product not found");
        }
    })  
);

export default productRoute;