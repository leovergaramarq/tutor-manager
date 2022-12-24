import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '../config.js'

function verifyToken(req, res, next) {
	const authHeader = req.headers['authorization'];
	if(!authHeader) return res.status(401).json({ message: 'No token provided' });
	
	try {
		req.token = jwt.verify(authHeader.split(' ')[1], JWT_SECRET);
	} catch (error) {
		console.log(error);
		if(error instanceof jwt.JsonWebTokenError) {
			return res.status(401).json({ message: 'Invalid token' });
		} else if (error instanceof jwt.TokenExpiredError) {
			return res.status(401).json({ message: 'Expired token' });
		}
		res.status(500).json({ message: 'Invalid token' });
	}
	next();
}

export default verifyToken;
