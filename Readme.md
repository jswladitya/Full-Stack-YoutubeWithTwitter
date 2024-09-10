# Making a full stack application having complex backend

1. install -> npm i -D nodemon : it is used to , not to restart the server again and again manually
2. install -> npm i -D prettier


# Setting up online mongoDB &
-> Add environment variables to connect DB & we gone to constants file & named our database as "videotube"


# connecting database & installing dependencies
-> since we will gonna load a lot of things fom .env so we need to install "npm i dotenv" 
-> later we gonna install mongoose & express
-> we communicate with mongoDB through mongoose so , in order to smooth process try using async await & wrap with try catch
-> as early as possible import and configure dotenv (because we need access of environment variables all over the app)

# 
-> installing dependencies : cookie-parser & cors
-> Middleware explained: its simply a safety check for a request , so that middlewares can validate the request in between the client & server