import express from 'express';
import { createUserSchema, loginUserSchema } from '../validation/request.validation.js';
import { hashPassword } from '../utils/hash.js';
import { getUserByEmail, createUser} from '../services/user.service.js';

import { generateToken } from '../utils/token.js';

const router = express.Router();

router.post('/signup', async(req, res) => {
    const validationResult = await  createUserSchema.safeParseAsync(req.body);

    if(!validationResult.success){
        const errors = validationResult.error.format();
        return res.status(400).json({ errors });
    }

    const { firstname, lastname, email, password } = validationResult.data;
    
    const existingUser = await getUserByEmail(email);
     
    if(existingUser){
        return res
            .status(400)
            .json({ message: `User with email ${email} already exists!` });
    }
    const {salt, hashedPassword} = hashPassword(password);    

    const newUser = await createUser({firstname, lastname, email, hashedPassword, salt});
    return res.status(201).json({data:{ userId: newUser.id }});
});

router.post('/login', async(req, res) => {
    const validationResult = await loginUserSchema.safeParseAsync(req.body);

    if(!validationResult.success){
        const errors = validationResult.error.format();
        return res.status(400).json({ errors });
    }
    const { email, password } = validationResult.data;

    const existingUser = await getUserByEmail(email);
    if(!existingUser){
        return res
            .status(404)
            .json({ message: `User with email ${email} does not exist!` });
    }

    const { hashedPassword } = await hashPassword(password, existingUser.salt);

    if(hashedPassword !== existingUser.password){
        return res
            .status(401)
            .json({ message: 'Invalid credentials!'});
    }

    const token = await generateToken({ id: existingUser.id });

    return res.status(200).json({ data: { token } });
});

export default router;