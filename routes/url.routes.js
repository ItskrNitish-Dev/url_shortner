import express from "express";
import { shortenUrlSchema } from "../validation/request.validation.js";
import { db } from "../db/index.js";
import { urlsTable } from "../models/index.js";
import { ensureAuthentication } from "../middlewares/auth.middleware.js";
import { nanoid } from "nanoid";
import { eq, and } from "drizzle-orm";

const router = express.Router();

/* -------------------------------------------------------
   CREATE SHORT URL (with unique shortUrl validation)
-------------------------------------------------------- */
router.post("/shorten", ensureAuthentication, async (req, res) => {
  try {
    // Zod validation
    const validationResult = await shortenUrlSchema.safeParseAsync(req.body);
    if (!validationResult.success) {
      return res
        .status(400)
        .json({ errors: validationResult.error.errors });
    }

    const { url, code } = validationResult.data;

    // If user provided a custom code → check if already exists
    let shortUrl = code ?? nanoid(6);

    // Ensure shortUrl is unique
let exists = await db
  .select()
  .from(urlsTable)
  .where(eq(urlsTable.shortUrl, shortUrl))
  .limit(1);

if (exists.length > 0 && code) {
  return res
    .status(400)
    .json({ message: "Short URL code already in use. Try another." });
}

// Auto-generate on conflict
while (exists.length > 0) {
  shortUrl = nanoid(6);

  exists = await db
    .select()
    .from(urlsTable)
    .where(eq(urlsTable.shortUrl, shortUrl))
    .limit(1);
}


    // Insert URL
    const [result] = await db
      .insert(urlsTable)
      .values({
        shortUrl,
        originalUrl: url,
        userId: req.user.id,
      })
      .returning({
        id: urlsTable.id,
        shortUrl: urlsTable.shortUrl,
        originalUrl: urlsTable.originalUrl,
      });

    return res.status(201).json({
      id: result.id,
      shortUrl: result.shortUrl,
      originalUrl: result.originalUrl,
    });
  } catch (err) {
    console.error("URL Shorten Error:", err);
    return res.status(500).json({ message: "Server error" });
  }
});

/* -------------------------------------------------------
   GET ALL SHORT CODES FOR AUTHENTICATED USER
-------------------------------------------------------- */
router.get("/codes", ensureAuthentication, async (req, res) => {
  const codes = await db
    .select()
    .from(urlsTable)
    .where(eq(urlsTable.userId, req.user.id));

  return res.json({ codes });
});

/* -------------------------------------------------------
   REDIRECT USING SHORT URL
-------------------------------------------------------- */
router.get("/:shortUrl", async (req, res) => {
  const code = req.params.shortUrl;

  const [result] = await db
    .select({
      originalUrl: urlsTable.originalUrl,
    })
    .from(urlsTable)
    .where(eq(urlsTable.shortUrl, code));

  if (!result) {
    return res.status(404).json({ message: "Short URL not found" });
  }

  return res.redirect(result.originalUrl);
});

/* -------------------------------------------------------
   DELETE URL (MUST BE UUID)
-------------------------------------------------------- */
router.delete("/:id", ensureAuthentication, async (req, res) => {
  try {
    const urlId = req.params.id;

    // Validate UUID (basic check)
    if (!/^[0-9a-fA-F-]{36}$/.test(urlId)) {
      return res.status(400).json({ message: "Invalid URL ID format (UUID expected)" });
    }

    // Perform delete with returning()
    const deleted = await db
      .delete(urlsTable)
      .where(and(eq(urlsTable.id, urlId), eq(urlsTable.userId, req.user.id)))
      .returning();

    // deleted = [] if nothing deleted
    if (deleted.length === 0) {
      return res
        .status(404)
        .json({ message: "URL not found or not authorized to delete" });
    }

    return res.json({ message: "URL deleted successfully" });

  } catch (err) {
    console.error("Delete URL Error:", err);
    return res.status(500).json({ message: "Server error" });
  }
});

export default router;
