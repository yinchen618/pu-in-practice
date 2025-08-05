function [priorh, penL1_list] = PenL1CP(xp, xu, prior_list, options)
% PenL1CP  Estimates a class-prior from postive and unlabeled data
%   From samples
%     {x^P_i}^{n_P}_{i=1} ~ p(x|y=+1),
%     {x^U_i}^{n_U}_{i=1} ~ p(x) = \theta_P p(x|y=+1) + \theta_N p(x|y=-1),
%     \theta_P = p(y=+1), \theta_N = p(y=-1),
%   this code estimates the class-prior p(y=+1) based on 
%   penalized L1-distance minimization [1].
% 
% Input:
%   xp: np by d positive sample matrix
%   xu: nu by d unlabeled sample matrix
%   prior: p(y=+1) class prior of unlabeled data
%   options.
%     n_fold:      the number of folds for cross-validation
%     model_type:  model for classifier
%       "gauss" uses Gaussian kernel basis function
%     lambda_list: candidates of regularization parameter
%     sigma_list:  candidates of bandwidth
%     b:           the number of basis functions
%
% Output:
%   priorh:     the estimated class-prior
%   penL1_list: the estimated penalized L1-distance in different candidates of 
%     class-prior 
%
% Reference:
%   [1] M.C. du Plessis, G. Niu, and M. Sugiyama
%     Class-prior estimation for learning from positive and unlabeled data.
%     In ACML, 2015.
% 
% (c) Tomoya Sakai, The University of Tokyo, Japan.
%       sakai@ms.k.u-tokyo.ac.jp

narginchk(4, 4);
global LOG model_type;

n_fold      = get_field_with_default(options, 'n_fold',      5);
model_type  = get_field_with_default(options, 'model_type', 'gauss');
lambda_list = get_field_with_default(options, 'lambda_list', logspace(-3, 1, 10));
b           = get_field_with_default(options, 'n_basis',     300);

if isempty(prior_list)
    prior_list = 0.05:.05:.95;
end

assert(0 < min(prior_list) & max(prior_list) < 1);

np = size(xp, 1);
nu = size(xu, 1);

b = min(b, nu);
center_index = randperm(nu, b);
xc = xu(center_index, :);

model_type = lower(model_type);
switch model_type
    case 'gauss'
        LOG.info(mfilename, 'Gauss kernel model is used.');        
    otherwise
        LOG.error(mfilename, 'Model type is invalid.');
        error('no model type\n');
end
n_lambda = length(lambda_list);
n_prior  = length(prior_list);

cv_index_p = floor((0:(np - 1))*n_fold/np) + 1;
cv_index_p = cv_index_p(randperm(np));
cv_index_u = floor((0:(nu - 1))*n_fold/nu) + 1;
cv_index_u = cv_index_u(randperm(nu));

switch model_type
    case 'gauss'
        dp = calc_dist2(xp, xc);        
        du = calc_dist2(xu, xc);        
end

sigma_list  = get_field_with_default(options, 'sigma_list',  ...
    sqrt(median(du(:)))*logspace(-2, 1, 10));
n_sigma  = length(sigma_list);

score_table = zeros(n_sigma, n_lambda, n_prior);
if n_sigma == 1 && n_lambda == 1
    score_table(1, 1, :) = -inf(n_prior, 1);
else
    for ite_sigma = 1:n_sigma        
        sigma = sigma_list(ite_sigma);
        [Kp, Ku] = calc_ker(dp, du, sigma);
        
        for ite_fold = 1:n_fold
            Kp_tr = Kp(cv_index_p ~= ite_fold, :);
            Kp_te = Kp(cv_index_p == ite_fold, :);
            Ku_tr = Ku(cv_index_u ~= ite_fold, :);
            Ku_te = Ku(cv_index_u == ite_fold, :);
            
            for ite_lambda = 1:n_lambda
                lambda   = lambda_list(ite_lambda);                
                LOG.trace(mfilename, sprintf('sigma: %f, lambda: %f', sigma, lambda));
                
                for ite_prior = 1:n_prior
                    prior = prior_list(ite_prior);
                    alpha_tr     = solve(Kp_tr, Ku_tr, prior, lambda);
                    [~, beta_te] = solve(Kp_te, Ku_te, prior, lambda);
                    score_table(ite_sigma, ite_lambda, ite_prior) = ...
                        score_table(ite_sigma, ite_lambda, ite_prior) ...
                        - alpha_tr'*beta_te/n_fold;
                end
            end % lambda
        end % fold
    end % sigma
end
penL1_list = zeros(n_prior, 1);
for ite_prior = 1:n_prior
    prior = prior_list(ite_prior);
    sub_score_table   = score_table(:, :, ite_prior);
    [~, chosen_index] = min(sub_score_table(:));    
    [sigma_index, lambda_index] = ind2sub(size(sub_score_table), chosen_index);
    sigma  = sigma_list(sigma_index);
    lambda = lambda_list(lambda_index);    
    [Kp, Ku] = calc_ker(dp, du, sigma);  
    [alpha, beta] = solve(Kp, Ku, prior, lambda);
    penL1_list(ite_prior) = alpha'*beta - prior + 1;
end

[~, best_prior_index] = min(penL1_list);
priorh = prior_list(best_prior_index);
LOG.trace(mfilename, sprintf('Estimated class-prior %f', priorh));


end


function [alpha, beta] = solve(Kp, Ku, prior, lambda)

beta  = prior*mean(Kp)' - mean(Ku)';
alpha = max(0, beta)/lambda;

end


function [Kp, Ku] = calc_ker(dp, du, sigma)
global model_type;

switch model_type
    case 'gauss'
        Kp = exp(-dp/(2*sigma^2));
        Ku = exp(-du/(2*sigma^2));
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

