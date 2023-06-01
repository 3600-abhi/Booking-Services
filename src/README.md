This is the base Nodejs project, which anyone can use as it has been prepared, by keeping some of
the most important code principles and project management recommendations. Feel free to change it

- `src` -> Inside the src folder all the actual source code regarding the project will reside, this will not include any type of tests. (you might want to make separate tests folder)

Let us take the look inside the `src` folder

- `config` -> In this folder anything and everything regarding any configurations or setup of library or module will be done. For example: setting up `dotenv` so that we can use the environment variables anywhere in a cleaner fashion, this is done in the `server-config.js`. One more example can be to setup your logging library that can help you to prepare meaningful logs, so configuration for this library should be also done here.

- `routes` -> In the routes folder, we register a route and the corresponding middleware and controllers to it.

- `middlewares` -> They are just going to intercept the incoming requests where we can write our validators, authenticators etc.

- `controllers` -> They are kind of last middleware as post them you call your business layer to execute the business logic. In controllers we just recieve the incoming requests and data and then pass it to business layer returns an output, we structure the API response in controllers and send the output.

- `repositories` -> This folder contains all the logic using which we interact with database by writing queries, all the raw queries or ORM queries will go here.

- `services` -> This folder contains the business logic and interacts with `repositories` for data from database.

- `utils` -> This folder contains helper methods, error classes etc.

### setup the project:

- Download the project from github and open it inside your favorite text editor

- Go inside the folder path and execute:
```
npm install
```

- In the root directory create a `.env` file and add the following env variables
```
PORT=<port number of your choice>
```
Example-
```
PORT=8000
```

- Go inside the `src` folder and execute the following command:
```
npx sequelize init
```

- By executing the above command you will get the seeders and migrations folder along with `config.json` inside config file

- If you are setting up your development environment, then mention the username and password of your database and in dialect mention whatever database you are using. For ex: mysql, mariadb etc.

- If you are setting up test or production environment make sure you are replace the host with the hosted url.

- To start the server execute:
```
npm run dev
```

- `seeders` -> It contains the testcases for test environment, like if we need some data so insted of inserting it into database we can mention here

- `migrations` -> This folder contains the different versions of database
