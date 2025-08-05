function [func_dec, outputs] = PU_SL(xp, xu, prior, options)
% PU_SL  Estimates classifiers from postive and unlabeled data
%   From samples
%     {x^P_i}^{n_P}_{i=1} ~ p(x|y=+1),
%     {x^U_i}^{n_U}_{i=1} ~ p(x) = \theta_P p(x|y=+1) + \theta_N p(x|y=-1),
%     \theta_P = p(y=+1), \theta_N = p(y=-1),
%   this code estimates a classifier
%     g(x): R^b -> R
%   based on PU learning with squared loss [1].
%   See also [2].
% 
% Input:
%   xp: np by d positive sample matrix
%   xu: nu by d unlabeled sample matrix
%   prior: p(y=+1) class prior of unlabeled data
%   options.
%     n_fold:      the number of folds for cross-validation
%     model_type:  model for classifier
%       "gauss" uses Gaussian kernel basis function
%       "lm" uses linear basis function
%     lambda_list: candidates of regularization parameter
%     sigma_list:  candidates of bandwidth
%     b:           the number of basis functions
%     use_bias: If true, model with intercept is used
%       Example, model_type='lm' and use_bias=true, the linear model w'*x+b is
%       used
%
% Output:
%   func_dec: estimated classifier, whose input is n by d test sample matrix
%     and sign of the output is estimated class labels.
%   outputs.
%     w: estimated parameter of the model, if use_bias=true, w(end) is the
%     intercept of the model.
%
% Reference:
%   [1] M.C. du Plessis, G. Niu, and M. Sugiyama
%     Convex formulation for learning from positive and unlabeled data. 
%     In ICML, 2015.
%   [2] M.C. du Plessis, G. Niu, and M. Sugiyama
%     Analysis of learning from positive and unlabeled data.
%     In NIPS, 2014.
% 
% (c) Tomoya Sakai, The University of Tokyo, Japan.
%       sakai@ms.k.u-tokyo.ac.jp

narginchk(4, 4);
global model_type LOG;

assert(0 < prior && prior < 1);

n_fold      = get_field_with_default(options, 'n_fold',      5);
model_type  = get_field_with_default(options, 'model_type', 'gauss');
lambda_list = get_field_with_default(options, 'lambda_list', logspace(-3, 1, 10));
b           = get_field_with_default(options, 'n_basis',     200);
use_bias    = get_field_with_default(options, 'use_bias',    false);

np = size(xp, 1);
nu = size(xu, 1);

b = min(b, nu);
center_index = randperm(nu, b);
xc = xu(center_index, :);

model_type = lower(model_type);
switch model_type
    case 'gauss'
        LOG.info(mfilename, 'Gauss kernel is used.');        
    case 'lm'
        LOG.info(mfilename, 'Linear model is used.');        
        sigma_list = 0;        
    otherwise
        LOG.error(mfilename, 'kernel type is invalid.');
        error('model type is invalid!\n');
end
n_lambda = length(lambda_list);

cv_index_p = floor((0:(np - 1))*n_fold/np) + 1;
cv_index_p = cv_index_p(randperm(np));
cv_index_u = floor((0:(nu - 1))*n_fold/nu) + 1;
cv_index_u = cv_index_u(randperm(nu));

switch model_type
    case 'gauss'
        dp = calc_dist2(xp, xc);
        du = calc_dist2(xu, xc);        
    case 'lm'
        dp = xp;
        du = xu;
end
clear xp xu 

if strcmp(model_type, 'gauss')
    sigma_list = get_field_with_default(options, 'sigma_list', ...
        sqrt(median([dp(:); du(:)]))*logspace(-2, 1, 10));    
else
    sigma_list = 1; % any value is ok
end
n_sigma  = length(sigma_list);

score_table = zeros(n_sigma, n_lambda, n_fold);
if n_sigma == 1 && n_lambda == 1 
    score_table(1, 1) = -inf;
else
    for ite_sigma = 1:n_sigma        
        sigma = sigma_list(ite_sigma);
        [Kp, Ku] = calc_ker(dp, du, sigma, use_bias);
            
        for ite_fold = 1:n_fold                 
            Hp_tr = prior*(Kp(cv_index_p ~= ite_fold, :)'*Kp(cv_index_p ~= ite_fold, :)) ...
                /sum(cv_index_p ~= ite_fold);
            Hu_tr = Ku(cv_index_u ~= ite_fold, :)'*Ku(cv_index_u ~= ite_fold, :) ...
                /sum(cv_index_u ~= ite_fold);
            hp_tr = prior*mean(Kp(cv_index_p ~= ite_fold, :), 1)';
            hu_tr = mean(Ku(cv_index_u ~= ite_fold, :), 1)';
            Kp_te = Kp(cv_index_p == ite_fold, :);            
            Ku_te = Ku(cv_index_u == ite_fold, :);
            
            for ite_lambda = 1:n_lambda
                lambda   = lambda_list(ite_lambda);
                
                if strcmp(model_type, 'gauss')
                    LOG.trace(mfilename, sprintf('sigma: %f, fold: %d, lambda: %f', sigma, ite_fold, lambda));
                else
                    LOG.trace(mfilename, sprintf('fold: %d, lambda: %f', ite_fold, lambda));
                end
                theta_cv = solve(Hu_tr, hp_tr, hu_tr, lambda, use_bias);
                
                score_table(ite_sigma, ite_lambda, ite_fold) = ...
                    score_table(ite_sigma, ite_lambda, ite_fold) ...
                    + calc_loss(Kp_te*theta_cv, Ku_te*theta_cv, prior)/n_fold;
            end % lambda
        end % hold
    end % sigma
    score_table = mean(score_table, 3);
end
[min_score, chosen_index] = min(score_table(:));    
[sigma_index, lambda_index] = ind2sub(size(score_table), chosen_index);
sigma  = sigma_list(sigma_index);
lambda = lambda_list(lambda_index);
LOG.trace(mfilename, sprintf('score: %f\n', min_score));
if strcmp(model_type, 'gauss')
    LOG.trace(mfilename, sprintf('selected sigma=%.4f, lambda=%.4f\n', sigma, lambda));
else
    LOG.trace(mfilename, sprintf('selected lambda=%.4f\n', lambda));
end
[Kp, Ku] = calc_ker(dp, du, sigma, use_bias);
theta = solve((Ku'*Ku)/nu, prior*mean(Kp, 1)', mean(Ku, 1)', lambda, use_bias);                
func_dec = make_func(theta, xc, sigma, use_bias);

if nargout > 1
    outputs.sigma_index  = sigma_index;    
    outputs.lambda_index = lambda_index;    
    outputs.score_table  = score_table;        
    outputs.w            = theta;   
end

end

function theta = solve(Hu, hp, hu, lambda, use_bias)

if isnan(hp) % if np = 0;
    Hp = 0; 
    hp = 0; 
end
    
if isnan(hu) % if nu = 0;
    Hu = 0;
    hu = 0;
end

b   = size(Hu, 1);
Reg = lambda*eye(b); 
if use_bias
    Reg(b, b) = 0;
end

hpu = 2*hp - hu;
R     = chol(Hu + Reg);
theta = R\(R'\hpu);

end

function loss = calc_loss(gp, gu, prior)
% calculate the loss

np = size(gp, 1);
nu = size(gu, 1);

if np ~= 0; fn   = mean(gp <= 0); else fn   = 0; end
if nu ~= 0; fp_u = mean(gu >= 0); else fp_u = 0; end
loss = prior*fn + max(fp_u + prior*fn - prior, 0);

end


function func_dec = make_func(theta, xc, sigma, use_bias)
global model_type

switch model_type
    case 'gauss'
        if use_bias
            func_dec = @(x_test) [exp(-calc_dist2(x_test, xc)/(2*sigma^2)), ones(size(x_test, 1), 1)]*theta;
        else
            func_dec = @(x_test) exp(-calc_dist2(x_test, xc)/(2*sigma^2))*theta;
        end
    case 'lm'
        if use_bias
            func_dec = @(x_test) [x_test, ones(size(x_test, 1), 1)]*theta;
        else
            func_dec = @(x_test) x_test*theta;
        end
end

end


function [Kp, Ku] = calc_ker(dp, du, sigma, use_bias)
global model_type;

np = size(dp, 1);
nu = size(du, 1);

switch model_type
    case 'gauss'
        Kp = exp(-dp/(2*sigma^2));
        Ku = exp(-du/(2*sigma^2));
    case 'lm'
        Kp = dp;
        Ku = du;
end
if use_bias
    Kp = [Kp, ones(np, 1)];
    Ku = [Ku, ones(nu, 1)];
end

end

function dist2 = calc_dist2(x, xc)
% make n by b squared-distance matrix, 
%   n is the number of samples, b is the number of basis functions.

dist2 = bsxfun(@plus, sum(x.^2, 2), bsxfun(@minus, sum(xc.^2, 2)', 2*x*xc'));

end


function ret = get_field_with_default(field, name, default)

if ~isfield(field, name) || isempty(field.(name));
    field.(name) = default;
end
ret = field.(name);

end