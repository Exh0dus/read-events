const axios = require('axios');
const git = require('simple-git');
require('dotenv').config();

function gitPushDigest(comment) {
    git(`./${process.env.GIT_PROJECT}`)
    .outputHandler((command, stdout, stderr) => {
        stdout.pipe(process.stdout);
        stderr.pipe(process.stderr);
    })
    .removeRemote('origin')
    .addRemote('origin', process.env.DIGEST_REPO)
    .add('./docs/*')
    .add('state.json')
    .commit(comment||'Update Journal')
    .push(['-u', 'origin', 'main']);
}

function gitPull(folder, repo, branch = 'main') {
    git(folder)
    .outputHandler((command, stdout, stderr) => {
        stdout.pipe(process.stdout);
        stderr.pipe(process.stderr);
    })
    .removeRemote('origin')
    .addRemote('origin', repo)
    .pull('origin', branch)
    .catch((err) => {
        console.error('Failed to pull before commit: ', err);
    });
}

async function getLatestWorkflowStatus() {
    const url = `https://api.github.com/repos/${process.env.GIT_USER}/${process.env.GIT_PROJECT}/actions/workflows/${process.env.GIT_WORKFLOW_ID}/runs`;
    const headers = { 'Authorization': `token ${process.env.GIT_AUTH}` };

    try {
        const response = await axios.get(url, { headers });
        const runs = response.data.workflow_runs;

        const latestRun = runs[0];
        return {status: latestRun.status, conclusion: latestRun.conclusion, url: latestRun.html_url};
    } catch (error) {
        console.error(error);
    }
}

async function waitForWorkflowCompletion(queryFrequency = 20000, timeout = 600000) {
    console.info('Waiting for workflow completion...');
    return new Promise((resolve, reject) => {
        const intervalId = setInterval(async () => {
            try {
                const latestRun = await getLatestWorkflowStatus();

                if (latestRun.status === 'completed') {
                    clearInterval(intervalId);
                    console.info(`Workflow completed with status: ${latestRun.conclusion}`);
                    resolve(latestRun.conclusion);
                }
            } catch (error) {
                clearInterval(intervalId);
                reject(error);
            }
        }, 20000); // 20 seconds

        const timeoutId = setTimeout(() => {
            clearInterval(intervalId);
            console.error('Timeout waiting for workflow completion');
            reject(new Error('Timeout waiting for workflow completion'));
        }, timeout);
    });
}

async function getWorkflows() {
    const url = `https://api.github.com/repos/${process.env.GIT_USER}/${process.env.GIT_PROJECT}/actions/workflows`;
    const headers = { 'Authorization': `token ${process.env.GIT_AUTH}` };

    try {
        const response = await axios.get(url, { headers });
        return response.data.workflows;
    } catch (error) {
        console.error(error);
    }
}

module.exports = { gitPushDigest, gitPull, waitForWorkflowCompletion };