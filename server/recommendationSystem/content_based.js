// Import necessary libraries
const fs = require('fs'); // Library for reading/writing files
const csv = require('csv-parser'); // Library for parsing CSV files
const _ = require('lodash'); // Lodash library for data manipulation
const { dot, norm } = require('mathjs'); // Math.js library for linear algebra operations
var mysql = require('mysql');


// Declare the Recommender class
class Recommender {
    // Constructor
    constructor() {
        this.movie_features = null; // Stores the features of the movies
        this.indices = null; // Stores the indices of the movies
        this.cosine_sim = null; // Stores the cosine similarity matrix
    }

    async load_data() {
        let con = mysql.createConnection({
            host: "localhost",
            user: "root",
            password: "vnn04",
            database: "mlops"
        });

        let movies = await new Promise((resolve, reject) => {
            con.query("SELECT * FROM movie", function (err, result, fields) {
                if (err) reject(err);
                resolve(result);
            });
        });

        this.movie_features = movies.map(movie => _.pick(movie, ["movieID",'Adventure','Animation','Comedy','Crime','Documentary','Drama','Family','Fantasy','History','Horror','Music','Mystery','Romance','Science Fiction','TV Movie','Thriller','War','Western']));
        let movie_features_values = this.movie_features.map(movie => Object.values(movie).slice(1).map(Number));
        this.cosine_sim = movie_features_values.map((movie, i) => movie_features_values.map((other_movie, j) => i === j ? 1 : dot(movie, other_movie) / (norm(movie) * norm(other_movie))));
        this.indices = _.keyBy(this.movie_features, 'movieID');
    }

    // Function to get recommendations
    get_recommendations(movieID) {
        let idx = _.findIndex(this.movie_features, ['movieID', movieID]);
        let sim_scores = this.cosine_sim[idx].map((score, i) => [i, score]).sort((a, b) => b[1] - a[1]);
        sim_scores = sim_scores.slice(1, 11);
        let movie_indices = sim_scores.map(score => score[0]);
        return movie_indices.map(i => this.movie_features[i]['movieID']);
    }
}

// Main function to run the program
async function main() {
    let recommender = new Recommender();
    await recommender.load_data('data/movies_data.csv');
    console.log(recommender.get_recommendations(recommender.movie_features[0]['movieID']));
}

// Run the main function
main();