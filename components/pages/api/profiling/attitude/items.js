import { loadAttitudeItems } from '../../../../lib/profiling/attitude';export default function handler(req,res){res.status(200).json({items:loadAttitudeItems()});}
