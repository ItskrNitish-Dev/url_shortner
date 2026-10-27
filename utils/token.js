import jwt from 'jsonwebtoken';
import { userTokenSchema } from '../validation/token.validation.js';

const JWT_SECRET = process.env.JWT_SECRET;

export function generateToken(payload, expiresIn = '1h') {
    const validationResult = userTokenSchema.safeParse(payload);
    if (!validationResult.success) {
        throw new Error('Invalid token payload');
    }

    const payloadValidatedData = validationResult.data;

    const token = jwt.sign(payloadValidatedData, JWT_SECRET, { expiresIn });
    return token;
}

export function verifyToken(token) {
    try {
        const payload = jwt.verify(token, JWT_SECRET);
        return payload;
    } catch (error) {
        return null;
    }
}    