import type { Router } from "express";
import mongoose from "mongoose";

export function validateObjectId(router: Router) {
  router.param("id", (req, res, next, id) => {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({
        success: false,
        message: "Invalid id",
        error: "Invalid id",
      });
      return;
    }
    next();
  });
}
