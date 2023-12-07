-- MySQl Database creation script
-- Create Users table
CREATE TABLE IF NOT EXISTS users (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(20) NOT NULL UNIQUE,
    password VARCHAR(128) NOT NULL,
    email VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create table to store model information for each user
CREATE TABLE IF NOT EXISTS models (
    model_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    model_name VARCHAR(20) NOT NULL,
    model_path VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id)
);