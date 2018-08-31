# Thematic Maps of *The Belt and Road*
A web-based map server consisting of several interactive thematic maps of China's *The Belt and Road Initiative*.

### Prerequisites
1. Install Node and NPM
2. Install MongoDB
3. Install Yarn: `npm install -g yarn`

### Initialize Database
- In any directory:
  ```
  mkdir db
  mongodb --dbpath db
  ```
- Now the database is running. Keep this session and open a new terminal for the following steps.

### Import Data
- In the project directory:
  ```
  cd scripts/mongo-import
  ```
- Then run:
  ```
  yarn install
  node import
  ```
- You will see two lines "Import countries finished." and "Import languages finished."

### Run Map Server
- In the project directory:
  ```
  cd service
  ```
- Then run:  
  ```
  yarn install
  yarn start
  ```
- All done! Now the server is listening on port 3000.

Go to `localhost:3000` to see the maps.