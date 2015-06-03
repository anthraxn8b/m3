DROP USER 'm3-system'@'localhost';
DROP USER 'm3-realm'@'localhost';

DROP DATABASE IF EXISTS m3;
CREATE DATABASE m3;
USE m3;
/*
CREATE TABLE user (
	username varchar(20) NOT NULL PRIMARY KEY,
	password varchar(32) NOT NULL
);
CREATE TABLE role (
	rolename varchar(20) NOT NULL PRIMARY KEY
);
CREATE TABLE userandrole (
	username varchar(20) NOT NULL,
	rolename varchar(20) NOT NULL,
	PRIMARY KEY (username, rolename),
	CONSTRAINT userandrole_foreign_key_1 FOREIGN KEY (username) REFERENCES user (username),
	CONSTRAINT userandrole_foreign_key_2 FOREIGN KEY (rolename) REFERENCES role (rolename)
);
*/
-- INSERT INTO user (user_name, password) VALUES ('boris',  's3cret');
-- INSERT INTO user (user_name, password) VALUES ('nicole', 's3cret');
-- INSERT INTO role (role_name) VALUES ('administrator');
-- INSERT INTO role (role_name) VALUES ('player');
-- INSERT INTO userandrole (username, rolename) VALUES ('boris',  'administrator');
-- INSERT INTO userandrole (username, rolename) VALUES ('boris',  'player');
-- INSERT INTO userandrole (username, rolename) VALUES ('nicole', 'player');

CREATE USER 'm3-system'@'localhost' IDENTIFIED BY '4fdefgt##ws334edd';
GRANT ALL ON m3.* TO 'm3-system'@'localhost';

CREATE USER 'm3-realm'@'localhost'  IDENTIFIED BY 'l3#kj97_jdf23edd3';
GRANT SELECT ON m3.user        TO 'm3-relm'@'localhost';
GRANT SELECT ON m3.userandrole TO 'm3-relm'@'localhost';


-- SET PASSWORD FOR 'm3'@'localhost' = PASSWORD('4fdefgt##ws334edd');
--
-- http://www.avajava.com/tutorials/lessons/how-do-i-use-a-jdbc-realm-with-tomcat-and-mysql.html
--
-- USE mysql;
-- CREATE USER 'realm_access'@'localhost' IDENTIFIED BY 'realmpass';
-- GRANT SELECT ON tomcat_realm.* TO realm_access@localhost;
