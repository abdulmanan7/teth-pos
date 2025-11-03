import { Router } from "express";
import {
  getTaxRates,
  createTaxRate,
  updateTaxRate,
  deleteTaxRate,
  setDefaultTaxRate,
} from "./taxRates";

const router = Router();

router.get("/", getTaxRates);
router.post("/", createTaxRate);
router.put("/:id", updateTaxRate);
router.delete("/:id", deleteTaxRate);
router.post("/:id/default", setDefaultTaxRate);

export default router;
