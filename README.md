# Clustering-Based Unsupervised Learning Web Application

This project introduces an intuitive web application designed to prioritize user security while delivering an effortless user experience. With a user-centric approach, the platform offers a simple and easy-to-use signup and login mechanism, ensuring users can access its robust functionalities securely. The application empowers users to effortlessly upload their datasets onto the portal or manually enter the data in the text fields available on the portal. Once uploaded, the platform leverages the K-Means Clustering algorithm to analyze the data, enabling users to derive meaningful insights and discover patterns within the dataset.

# Instructions To Run The Code

The system on which you want to run the code should have Python 3, MySQL, and Node.js already set up. The Python environment should have the following packages pre-installed before running the code.

1. Pandas
2. Numpy
3. Scikit-Learn
4. MatplotLib

To set up the Node.js environment with the required packages, you can run the following command after cd’ing into the working directory.

    npm install

The above command would install the required packages and the below command can be run in the terminal window.

    npm start

Before running the above command, I would suggest that you should change the MySQL username and password in the server.js file from lines 71-78. Set up your database using the SQL queries in the “create_db.sql” file.

The web application can then be accessed using any browser with the following link, _localhost:3000/_.
