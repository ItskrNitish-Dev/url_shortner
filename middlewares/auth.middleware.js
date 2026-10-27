import {verifyToken} from "../utils/token.js";

/**
 * 
 * @param {import("express").Request} req 
 * @param {import("express").Response} res 
 * @param {import("express").NextFunction} next 
 */

export function authMiddleware(req, res, next) {
    const authHeader = req.headers['authorization'];
    if (!authHeader) return next();

    if(!authHeader.startsWith('Bearer')){
        return res.status(400).json({ message: 'Invalid authorization header format' });
    }
    const [_, token] = authHeader.split(' ');
    const payload = verifyToken(token);

    if (!payload) {
        return res.status(401).json({ message: 'Invalid or expired token' });
    }
    req.user = payload;
    next();
} 


/**
 * 
 * @param {import("express").Request} req 
 * @param {import("express").Response} res 
 * @param {import("express").NextFunction} next 
 */

export function ensureAuthentication(req, res, next) {
    if (!req.user || !req.user.id) {
        return res
        .status(401)
        .json({ message: 'You must be looged in to access this resource' });
    }
    next();
};    