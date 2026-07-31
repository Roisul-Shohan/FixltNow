import app from "./app.js";
import config from "./config/index.js";
import { prisma } from "./lib/prisma.js";
import { AvailabilityService } from "./modules/availibility/availibility.service.js";



 const PORT = config.port;

async function  main() {
    try {
       await prisma.$connect();
       console.log("database connected succesfully");
       app.listen(PORT,()=>{
        console.log(`Server is running on port ${PORT}`);
      });

      // Roll the 7-day technician availability window once on startup to
      // purge any stale slots, then keep it rolling forward at midnight
      // every day in the app's timezone.
      AvailabilityService.runAvailabilityRollForAllTechnicians().catch(
        (err) => console.error("[availability-roll] startup run failed:", err)
      );
      AvailabilityService.scheduleDailyAvailabilityRoll();

    } catch (error) {
        console.error("Error starting the server:", error);
        await prisma.$disconnect();
        process.exit(1);
    }
    
}

main();