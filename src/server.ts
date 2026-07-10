import app from "./app.js";
import config from "./config/index.js";
import { prisma } from "./lib/prisma.js";



 const PORT = config.port;

async function  main() {
    try {
       await prisma.$connect();
       console.log("database connected succesfully");
       app.listen(PORT,()=>{
        console.log(`Server is running on port ${PORT}`);
       })
        
    } catch (error) {
        console.error("Error starting the server:", error);
        await prisma.$disconnect();
        process.exit(1);
    }
    
}

main();