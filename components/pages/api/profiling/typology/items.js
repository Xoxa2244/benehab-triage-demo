import { loadTypologyItems } from '../../../../lib/profiling/typology';export default function handler(req,res){res.status(200).json({items:loadTypologyItems()});}
