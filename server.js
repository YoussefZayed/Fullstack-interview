const express = require('express');
const { Pool } = require('pg');

const app = express();
app.use(express.json());

// Add CORS headers
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    next();
});

// PostgreSQL connection configuration
const pool = new Pool({
    connectionString: '---'
});

// Test database connection
pool.connect((err, client, done) => {
    if (err) {
        console.error('Error connecting to the database:', err);
    } else {
        console.log('Successfully connected to the database');
        done();
    }
});

// Endpoint to handle the query
app.get('/query', async (req, res) => {
    const { username, hashtag } = req.query;

    if (!username) {
        return res.status(400).json({ error: 'Username is required' });
    }

    // Parse username to integer
    const userId = parseInt(username, 10);
    if (isNaN(userId)) {
        return res.status(400).json({ error: 'Username must be a valid integer ID' });
    }

    const query = `
    WITH TargetUser AS (
        SELECT user_id, birthday
        FROM Users
        WHERE user_id = $1
    ),
    TargetUserBirthday AS (
        SELECT
            EXTRACT(MONTH FROM birthday) as b_month,
            EXTRACT(DAY FROM birthday) as b_day
        FROM TargetUser
    ),
    TargetFriends AS (
        SELECT user_id2 AS friend_id
        FROM Friends
        JOIN TargetUser ON Friends.user_id1 = TargetUser.user_id
        UNION
        SELECT user_id1 AS friend_id
        FROM Friends
        JOIN TargetUser ON Friends.user_id2 = TargetUser.user_id
    ),
    LikesOnBirthdayByFriends AS (
        SELECT
            L.user_id AS liking_friend_id,
            L.post_id AS liked_post_id,
            P.user_id AS post_author_id
        FROM Likes L
        JOIN Posts P ON L.post_id = P.post_id
        JOIN TargetUserBirthday B ON EXTRACT(MONTH FROM L.like_timestamp) = B.b_day
                                  AND EXTRACT(DAY FROM L.like_timestamp) = B.b_month
        WHERE
            L.user_id IN (SELECT friend_id FROM TargetFriends)
    ),
    QualifyingLikes AS (
        SELECT
            LBF.liking_friend_id,
            LBF.liked_post_id,
            LBF.post_author_id
        FROM LikesOnBirthdayByFriends LBF
        JOIN TargetUser TU ON LBF.post_author_id != TU.user_id
        WHERE
            LBF.post_author_id IN (SELECT friend_id FROM TargetFriends)
    ),
    FriendsWhoLikedTargetUserPostOnBirthday AS (
        SELECT DISTINCT LBF.liking_friend_id
        FROM LikesOnBirthdayByFriends LBF
        JOIN TargetUser TU ON LBF.post_author_id = TU.user_id
    )
    SELECT DISTINCT
        QL.liking_friend_id,
        LikingFriend.name AS liking_friend_name,
        QL.liked_post_id,
        LikedPost.post_timestamp AS liked_post_timestamp,
        QL.post_author_id AS author_id,
        PostAuthor.name AS author_name,
        PH.hashtag_text
    FROM QualifyingLikes QL
    JOIN Users LikingFriend ON QL.liking_friend_id = LikingFriend.user_id
    JOIN Users PostAuthor ON QL.post_author_id = PostAuthor.user_id
    JOIN Posts LikedPost ON QL.liked_post_id = LikedPost.post_id
    JOIN PostHashtags PH ON QL.liked_post_id = PH.post_id
    WHERE
        NOT EXISTS (
            SELECT 1
            FROM FriendsWhoLikedTargetUserPostOnBirthday Excluded
            WHERE Excluded.liking_friend_id = QL.liking_friend_id
        )
        AND (
            PH.hashtag_text = $2
            OR $2 IS NULL
            OR $2 = ''
        )
    ORDER BY
        liking_friend_name,
        QL.liked_post_id,
        hashtag_text;
    `;

    try {
        const result = await pool.query(query, [hashtag, userId]);
        res.json(result);
    } catch (error) {
        console.error('Error executing query:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
}); 