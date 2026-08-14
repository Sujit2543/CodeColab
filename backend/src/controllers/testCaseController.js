const TestCase = require('../models/TestCase');
const Project = require('../models/Project');
const { successResponse, errorResponse } = require('../utils/apiResponse');

async function getTestCases(req, res) {
  try {
    const { projectId } = req.params;
    const project = await Project.findById(projectId);
    if (!project) return errorResponse(res, 'Project not found', 404, 'NOT_FOUND');

    const isOwner = project.owner.toString() === req.user._id.toString();
    const isCollaborator = project.collaborators.some((c) => c.toString() === req.user._id.toString());
    if (!project.isPublic && !isOwner && !isCollaborator) {
      return errorResponse(res, 'Access denied', 403, 'FORBIDDEN');
    }

    const testCases = await TestCase.find({ project: projectId }).sort({ createdAt: 1 });
    return successResponse(res, { testCases }, 'Test cases fetched');
  } catch (err) {
    return errorResponse(res, 'Failed to fetch test cases', 500);
  }
}

async function createTestCase(req, res) {
  try {
    const { projectId } = req.params;
    const { label, input, expectedOutput, isHidden, language, fileId } = req.body;

    if (!label) return errorResponse(res, 'Label is required', 400, 'VALIDATION_ERROR');

    const project = await Project.findById(projectId);
    if (!project) return errorResponse(res, 'Project not found', 404, 'NOT_FOUND');

    const isOwner = project.owner.toString() === req.user._id.toString();
    const isCollaborator = project.collaborators.some((c) => c.toString() === req.user._id.toString());
    if (!isOwner && !isCollaborator) {
      return errorResponse(res, 'Access denied', 403, 'FORBIDDEN');
    }

    const testCase = await TestCase.create({
      project: projectId,
      fileId: fileId || null,
      label,
      input: input || '',
      expectedOutput: expectedOutput || '',
      isHidden: !!isHidden,
      language: language || 'javascript',
      createdBy: req.user._id,
    });

    return successResponse(res, { testCase }, 'Test case created', 201);
  } catch (err) {
    return errorResponse(res, 'Failed to create test case', 500);
  }
}

async function updateTestCase(req, res) {
  try {
    const tc = await TestCase.findById(req.params.id);
    if (!tc) return errorResponse(res, 'Test case not found', 404, 'NOT_FOUND');

    const project = await Project.findById(tc.project);
    const isOwner = project?.owner.toString() === req.user._id.toString();
    const isCollaborator = project?.collaborators.some((c) => c.toString() === req.user._id.toString());
    if (!isOwner && !isCollaborator) {
      return errorResponse(res, 'Access denied', 403, 'FORBIDDEN');
    }

    const { label, input, expectedOutput, isHidden, language } = req.body;
    if (label !== undefined) tc.label = label;
    if (input !== undefined) tc.input = input;
    if (expectedOutput !== undefined) tc.expectedOutput = expectedOutput;
    if (isHidden !== undefined) tc.isHidden = isHidden;
    if (language !== undefined) tc.language = language;
    await tc.save();

    return successResponse(res, { testCase: tc }, 'Test case updated');
  } catch (err) {
    return errorResponse(res, 'Failed to update test case', 500);
  }
}

async function deleteTestCase(req, res) {
  try {
    const tc = await TestCase.findById(req.params.id);
    if (!tc) return errorResponse(res, 'Test case not found', 404, 'NOT_FOUND');

    const project = await Project.findById(tc.project);
    const isOwner = project?.owner.toString() === req.user._id.toString();
    if (!isOwner) return errorResponse(res, 'Only project owner can delete test cases', 403, 'FORBIDDEN');

    await tc.deleteOne();
    return successResponse(res, {}, 'Test case deleted');
  } catch (err) {
    return errorResponse(res, 'Failed to delete test case', 500);
  }
}

module.exports = { getTestCases, createTestCase, updateTestCase, deleteTestCase };
